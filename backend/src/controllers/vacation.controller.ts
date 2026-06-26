import { Request, Response } from 'express';
import { z } from 'zod';
import { RequestStatus, Role, ApprovalDecision } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { calendarDaysBetween, addOneDay, toDateString, formatDateAR } from '../utils/dates';
import { getEmployeeBalance } from '../services/vacation.service';
import { ensureCycle } from '../services/cycle.service';
import { recordAudit } from '../services/audit.service';
import { notifyUser } from '../services/notification.service';
import { sendMail, buildDecisionEmail } from '../utils/email';

export const createRequestSchema = z
  .object({
    employeeId: z.string().uuid().optional(), // opcional: empleados usan el suyo
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    chargedToYear: z.number().int().optional().nullable(),
    reason: z.string().max(500).optional().nullable(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: 'La fecha de fin debe ser posterior o igual a la de inicio',
    path: ['endDate'],
  });

export const updateRequestSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    chargedToYear: z.number().int().optional().nullable(),
    reason: z.string().max(500).optional().nullable(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: 'La fecha de fin debe ser posterior o igual a la de inicio',
    path: ['endDate'],
  });

export const decisionSchema = z.object({
  decision: z.nativeEnum(ApprovalDecision),
  comment: z.string().max(500).optional().nullable(),
});

const requestInclude = {
  employee: { include: { department: true } },
  approvals: { include: { approver: { select: { email: true } } }, orderBy: { createdAt: 'desc' as const } },
};

/** Lista solicitudes. Los empleados sólo ven las suyas; managers ven su sector; admins ven todo. */
export async function list(req: Request, res: Response) {
  const { status, employeeId, departmentId, from, to } = req.query as Record<string, string | undefined>;
  const { role, managedDepartmentId } = req.user!;
  const isAdmin = role === Role.ADMIN;
  const isManager = role === Role.MANAGER;

  const where: Record<string, unknown> = {};
  if (isAdmin) {
    if (employeeId) where.employeeId = employeeId;
    if (departmentId) where.employee = { departmentId };
  } else if (isManager) {
    // Solo solicitudes del sector a cargo
    where.employee = { departmentId: managedDepartmentId };
    if (employeeId) where.employeeId = employeeId;
  } else {
    where.employeeId = req.user!.employeeId;
  }
  if (status) where.status = status as RequestStatus;
  if (from || to) {
    where.startDate = {};
    if (from) (where.startDate as Record<string, Date>).gte = new Date(from);
    if (to) (where.startDate as Record<string, Date>).lte = new Date(to);
  }

  const requests = await prisma.vacationRequest.findMany({
    where,
    include: requestInclude,
    orderBy: { startDate: 'desc' },
  });
  res.json(requests);
}

/** Eventos para el calendario de equipo (sólo aprobadas + pendientes). */
export async function calendar(req: Request, res: Response) {
  const { from, to } = req.query as Record<string, string | undefined>;
  const { role, managedDepartmentId } = req.user!;
  const isManager = role === Role.MANAGER;

  const where: Record<string, unknown> = {
    status: { in: [RequestStatus.APPROVED, RequestStatus.PENDING] },
  };
  if (isManager && managedDepartmentId) {
    where.employee = { departmentId: managedDepartmentId };
  }
  if (from || to) {
    where.startDate = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const requests = await prisma.vacationRequest.findMany({
    where,
    include: { employee: { include: { department: true } } },
  });

  const events = requests.map((r) => ({
    id: r.id,
    title: `${r.employee.firstName} ${r.employee.lastName} - ${r.employee.department.name}`,
    start: toDateString(r.startDate),
    end: toDateString(addOneDay(r.endDate)),
    allDay: true,
    color: r.employee.color,
    borderColor: r.employee.department.color,
    extendedProps: {
      type: 'vacation' as const,
      department: r.employee.department.name,
      departmentColor: r.employee.department.color,
      status: r.status,
      reason: r.reason,
      days: r.daysRequested,
      employee: `${r.employee.firstName} ${r.employee.lastName}`,
    },
  }));

  const holidays = await prisma.holiday.findMany({ orderBy: { date: 'asc' } });
  const holidayEvents = holidays.map((h) => ({
    id: `holiday-${h.id}`,
    title: h.name,
    start: toDateString(h.date),
    end: toDateString(addOneDay(h.date)),
    allDay: true,
    color: '#ef4444',
    extendedProps: {
      type: 'holiday' as const,
      deductsVacation: h.deductsVacation,
    },
  }));

  res.json([...events, ...holidayEvents]);
}

export async function getById(req: Request, res: Response) {
  const request = await prisma.vacationRequest.findUnique({
    where: { id: req.params.id },
    include: requestInclude,
  });
  if (!request) throw ApiError.notFound('Solicitud no encontrada');
  const { role, managedDepartmentId, employeeId } = req.user!;
  const isAdmin = role === Role.ADMIN;
  const isManager = role === Role.MANAGER;
  const isOwner = request.employeeId === employeeId;
  const isManagedDept = isManager && request.employee.departmentId === managedDepartmentId;
  if (!isAdmin && !isOwner && !isManagedDept) throw ApiError.forbidden();
  res.json(request);
}

export async function create(req: Request, res: Response) {
  const body = req.body as z.infer<typeof createRequestSchema>;
  const isAdmin = req.user!.role === Role.ADMIN;

  // Un empleado sólo puede solicitar para sí mismo.
  const employeeId = isAdmin && body.employeeId ? body.employeeId : req.user!.employeeId;
  if (!employeeId) throw ApiError.badRequest('No se ha indicado el empleado');

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw ApiError.notFound('Empleado no encontrado');
  if (employee.status === 'INACTIVE') throw ApiError.badRequest('El empleado está inactivo');

  const calendarDays = calendarDaysBetween(body.startDate, body.endDate);
  // Solo descontar feriados que caen en el día de inicio (desplazan el comienzo).
  // Feriados dentro o al final del período no reducen los días corridos (LCT).
  const startDayHoliday = await prisma.holiday.count({
    where: {
      date: body.startDate,
      deductsVacation: false,
    },
  });
  const days = Math.max(0, calendarDays - startDayHoliday);
  if (days <= 0) throw ApiError.badRequest('El rango no contiene días laborables');

  // ── Validación de año ──────────────────────────────────────────────────────
  const targetYear = body.chargedToYear ?? body.startDate.getFullYear();
  const currentYear = new Date().getFullYear();

  if (targetYear < currentYear && !isAdmin) {
    throw ApiError.badRequest('No se pueden registrar vacaciones en años pasados');
  }

  if (targetYear > currentYear + 1) {
    throw ApiError.badRequest('No se pueden solicitar vacaciones con más de un año de anticipación');
  }

  if (targetYear === currentYear + 1) {
    // Verificar configuración de solicitudes adelantadas
    const config = await prisma.systemConfig.findUnique({ where: { id: 'singleton' } });
    if (!config?.allowAdvanceRequest) {
      throw ApiError.badRequest('Las solicitudes adelantadas al año siguiente no están habilitadas');
    }
    // Verificar que el ciclo del año siguiente esté abierto
    const openMonth = (config?.nextYearOpenMonth ?? 10) - 1;
    const openDay = config?.nextYearOpenDay ?? 1;
    const openDate = new Date(Date.UTC(currentYear, openMonth, openDay));
    if (new Date() < openDate) {
      const d = `${String(openDay).padStart(2, '0')}/${String(openMonth + 1).padStart(2, '0')}/${currentYear}`;
      throw ApiError.badRequest(
        `El ciclo ${targetYear} aún no está abierto. Se habilitará el ${d}`,
      );
    }
    // Asegurarse de que el ciclo existe y está abierto
    await ensureCycle(employeeId, targetYear);
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Validar superposición con otras solicitudes activas del mismo empleado.
  const overlapping = await prisma.vacationRequest.findFirst({
    where: {
      employeeId,
      status: { in: [RequestStatus.APPROVED, RequestStatus.PENDING] },
      startDate: { lte: body.endDate },
      endDate: { gte: body.startDate },
    },
  });
  if (overlapping) throw ApiError.conflict('Ya existe una solicitud que se solapa con esas fechas');

  // Validación A: exclusiones mutuas
  const exclusions = await prisma.vacationExclusion.findMany({
    where: { OR: [{ employeeAId: employeeId }, { employeeBId: employeeId }] },
    include: {
      employeeA: { select: { id: true, firstName: true, lastName: true } },
      employeeB: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (exclusions.length > 0) {
    const counterpartMap = new Map<string, string>();
    for (const e of exclusions) {
      if (e.employeeAId === employeeId) {
        counterpartMap.set(e.employeeBId, `${e.employeeB.firstName} ${e.employeeB.lastName}`);
      } else {
        counterpartMap.set(e.employeeAId, `${e.employeeA.firstName} ${e.employeeA.lastName}`);
      }
    }
    const conflict = await prisma.vacationRequest.findFirst({
      where: {
        employeeId: { in: [...counterpartMap.keys()] },
        status: { in: [RequestStatus.APPROVED, RequestStatus.PENDING] },
        startDate: { lte: body.endDate },
        endDate: { gte: body.startDate },
      },
    });
    if (conflict) {
      const name = counterpartMap.get(conflict.employeeId) ?? 'otro empleado';
      throw ApiError.conflict(
        `No se pueden solicitar vacaciones en estas fechas debido a una regla de exclusión mutua con ${name}.`,
      );
    }
  }

  // Validación B: límite de simultaneidad por cargo
  const posLimit = await prisma.positionOverlapLimit.findUnique({
    where: { position: employee.position },
  });
  if (posLimit) {
    const othersOnVacation = await prisma.vacationRequest.findMany({
      where: {
        employeeId: { not: employeeId },
        status: { in: [RequestStatus.APPROVED, RequestStatus.PENDING] },
        employee: { position: employee.position, status: 'ACTIVE' },
        startDate: { lte: body.endDate },
        endDate: { gte: body.startDate },
      },
      select: { startDate: true, endDate: true },
    });
    if (othersOnVacation.length >= posLimit.maxEmployees) {
      const startMs = body.startDate.getTime();
      const endMs = body.endDate.getTime();
      for (let ms = startMs; ms <= endMs; ms += 86400000) {
        const day = new Date(ms).toISOString().slice(0, 10);
        const count = othersOnVacation.filter(
          (r) => r.startDate.toISOString().slice(0, 10) <= day && r.endDate.toISOString().slice(0, 10) >= day,
        ).length;
        if (count >= posLimit.maxEmployees) {
          throw ApiError.conflict(
            `Se supera el límite máximo de empleados de la posición '${employee.position}' tomándose vacaciones al mismo tiempo (Límite: ${posLimit.maxEmployees}).`,
          );
        }
      }
    }
  }

  // Validar saldo disponible para el año objetivo.
  const balance = await getEmployeeBalance(employeeId, targetYear);
  if (!balance.cycleOpen && !isAdmin) {
    throw ApiError.badRequest(`El ciclo ${targetYear} no está habilitado para recibir solicitudes`);
  }
  if (days > balance.available) {
    throw ApiError.badRequest(
      `Saldo insuficiente: solicita ${days} días pero sólo dispone de ${balance.available}`,
    );
  }

  // Aplicar límite de días adelantados si aplica
  if (targetYear === currentYear + 1) {
    const config = await prisma.systemConfig.findUnique({ where: { id: 'singleton' } });
    const maxAdvance = config?.maxAdvanceDays ?? 0;
    if (maxAdvance > 0 && (balance.used + balance.pending + days) > maxAdvance) {
      throw ApiError.badRequest(
        `Límite de solicitudes adelantadas: sólo se permiten ${maxAdvance} días anticipados del año ${targetYear}`,
      );
    }
  }

  const request = await prisma.vacationRequest.create({
    data: {
      employeeId,
      startDate: body.startDate,
      endDate: body.endDate,
      daysRequested: days,
      chargedToYear: targetYear,
      reason: body.reason ?? null,
      status: RequestStatus.PENDING,
    },
    include: requestInclude,
  });

  await recordAudit({ action: 'CREATE', entity: 'VacationRequest', entityId: request.id, userId: req.user!.sub, metadata: { employee: `${request.employee.firstName} ${request.employee.lastName}`, startDate: toDateString(body.startDate), endDate: toDateString(body.endDate), days } });
  res.status(201).json(request);
}

/** Aprobar o rechazar una solicitud (admin o manager de sector). */
export async function decide(req: Request, res: Response) {
  const { decision, comment } = req.body as z.infer<typeof decisionSchema>;
  const request = await prisma.vacationRequest.findUnique({
    where: { id: req.params.id },
    include: { employee: { include: { user: true } } },
  });
  if (!request) throw ApiError.notFound('Solicitud no encontrada');

  // MANAGER: verificar que la solicitud pertenece a su sector y no es la suya propia
  if (req.user!.role === Role.MANAGER) {
    if (request.employee.departmentId !== req.user!.managedDepartmentId) {
      throw ApiError.forbidden('Solo puedes aprobar solicitudes de tu sector');
    }
    if (request.employeeId === req.user!.employeeId) {
      throw ApiError.forbidden('No puedes aprobar tu propia solicitud');
    }
  }

  const newStatus =
    decision === ApprovalDecision.APPROVED ? RequestStatus.APPROVED : RequestStatus.REJECTED;

  const [updated] = await prisma.$transaction([
    prisma.vacationRequest.update({ where: { id: request.id }, data: { status: newStatus } }),
    prisma.approvalHistory.create({
      data: { requestId: request.id, approverId: req.user!.sub, decision, comment: comment ?? null },
    }),
  ]);

  // Notificaciones (in-app + email) al empleado.
  const fmt = (d: Date) => formatDateAR(d);
  const approved = decision === ApprovalDecision.APPROVED;
  if (request.employee.user) {
    await notifyUser(
      request.employee.user.id,
      `Solicitud ${approved ? 'aprobada' : 'rechazada'}`,
      `Tu solicitud del ${fmt(request.startDate)} al ${fmt(request.endDate)} ha sido ${approved ? 'aprobada' : 'rechazada'}.`,
    );
  }
  await sendMail({
    to: request.employee.email,
    subject: `Solicitud de vacaciones ${approved ? 'APROBADA' : 'RECHAZADA'} — Canal Directo`,
    html: buildDecisionEmail(
      `${request.employee.firstName} ${request.employee.lastName}`,
      approved,
      fmt(request.startDate),
      fmt(request.endDate),
      comment,
    ),
  });

  await recordAudit({
    action: approved ? 'APPROVE' : 'REJECT',
    entity: 'VacationRequest',
    entityId: request.id,
    userId: req.user!.sub,
    metadata: { employee: `${request.employee.firstName} ${request.employee.lastName}`, startDate: toDateString(request.startDate), endDate: toDateString(request.endDate), days: request.daysRequested, comment },
  });

  res.json(updated);
}

export async function overlaps(req: Request, res: Response) {
  const request = await prisma.vacationRequest.findUnique({
    where: { id: req.params.id },
    include: { employee: true },
  });
  if (!request) throw ApiError.notFound('Solicitud no encontrada');

  // MANAGER: solo puede ver solapamientos de su sector
  if (req.user!.role === Role.MANAGER && request.employee.departmentId !== req.user!.managedDepartmentId) {
    throw ApiError.forbidden('Solo puedes ver solapamientos de tu sector');
  }

  const teamRequests = await prisma.vacationRequest.findMany({
    where: {
      id: { not: request.id },
      status: { in: [RequestStatus.APPROVED, RequestStatus.PENDING] },
      employee: { departmentId: request.employee.departmentId },
      startDate: { lte: request.endDate },
      endDate: { gte: request.startDate },
    },
    include: { employee: { include: { department: true } } },
    orderBy: { startDate: 'asc' },
  });

  const teamSize = await prisma.employee.count({
    where: { departmentId: request.employee.departmentId, status: 'ACTIVE' },
  });

  res.json({ overlaps: teamRequests, teamSize });
}

export async function update(req: Request, res: Response) {
  const body = req.body as z.infer<typeof updateRequestSchema>;
  const request = await prisma.vacationRequest.findUnique({
    where: { id: req.params.id },
    include: { employee: true },
  });
  if (!request) throw ApiError.notFound('Solicitud no encontrada');

  const isOwner = request.employeeId === req.user!.employeeId;
  const isAdmin = req.user!.role === Role.ADMIN;
  if (!isAdmin && !isOwner) throw ApiError.forbidden();
  if (!isAdmin && request.status !== RequestStatus.PENDING) {
    throw ApiError.badRequest('Sólo puedes editar solicitudes pendientes');
  }
  if (request.employee.status === 'INACTIVE') {
    throw ApiError.badRequest('No se pueden modificar solicitudes de empleados inactivos');
  }

  const calendarDays = calendarDaysBetween(body.startDate, body.endDate);
  const startDayHoliday = await prisma.holiday.count({
    where: {
      date: body.startDate,
      deductsVacation: false,
    },
  });
  const days = Math.max(0, calendarDays - startDayHoliday);
  if (days <= 0) throw ApiError.badRequest('El rango no contiene días laborables');

  const overlapping = await prisma.vacationRequest.findFirst({
    where: {
      id: { not: request.id },
      employeeId: request.employeeId,
      status: { in: [RequestStatus.APPROVED, RequestStatus.PENDING] },
      startDate: { lte: body.endDate },
      endDate: { gte: body.startDate },
    },
  });
  if (overlapping) throw ApiError.conflict('Ya existe una solicitud que se solapa con esas fechas');

  // Validación A: exclusiones mutuas
  const updateExclusions = await prisma.vacationExclusion.findMany({
    where: { OR: [{ employeeAId: request.employeeId }, { employeeBId: request.employeeId }] },
    include: {
      employeeA: { select: { id: true, firstName: true, lastName: true } },
      employeeB: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (updateExclusions.length > 0) {
    const counterpartMap = new Map<string, string>();
    for (const e of updateExclusions) {
      if (e.employeeAId === request.employeeId) {
        counterpartMap.set(e.employeeBId, `${e.employeeB.firstName} ${e.employeeB.lastName}`);
      } else {
        counterpartMap.set(e.employeeAId, `${e.employeeA.firstName} ${e.employeeA.lastName}`);
      }
    }
    const conflict = await prisma.vacationRequest.findFirst({
      where: {
        id: { not: request.id },
        employeeId: { in: [...counterpartMap.keys()] },
        status: { in: [RequestStatus.APPROVED, RequestStatus.PENDING] },
        startDate: { lte: body.endDate },
        endDate: { gte: body.startDate },
      },
    });
    if (conflict) {
      const name = counterpartMap.get(conflict.employeeId) ?? 'otro empleado';
      throw ApiError.conflict(
        `No se pueden solicitar vacaciones en estas fechas debido a una regla de exclusión mutua con ${name}.`,
      );
    }
  }

  // Validación B: límite de simultaneidad por cargo
  const updatePosLimit = await prisma.positionOverlapLimit.findUnique({
    where: { position: request.employee.position },
  });
  if (updatePosLimit) {
    const othersOnVacation = await prisma.vacationRequest.findMany({
      where: {
        id: { not: request.id },
        employeeId: { not: request.employeeId },
        status: { in: [RequestStatus.APPROVED, RequestStatus.PENDING] },
        employee: { position: request.employee.position, status: 'ACTIVE' },
        startDate: { lte: body.endDate },
        endDate: { gte: body.startDate },
      },
      select: { startDate: true, endDate: true },
    });
    if (othersOnVacation.length >= updatePosLimit.maxEmployees) {
      const startMs = body.startDate.getTime();
      const endMs = body.endDate.getTime();
      for (let ms = startMs; ms <= endMs; ms += 86400000) {
        const day = new Date(ms).toISOString().slice(0, 10);
        const count = othersOnVacation.filter(
          (r) => r.startDate.toISOString().slice(0, 10) <= day && r.endDate.toISOString().slice(0, 10) >= day,
        ).length;
        if (count >= updatePosLimit.maxEmployees) {
          throw ApiError.conflict(
            `Se supera el límite máximo de empleados de la posición '${request.employee.position}' tomándose vacaciones al mismo tiempo (Límite: ${updatePosLimit.maxEmployees}).`,
          );
        }
      }
    }
  }

  const updateTargetYear = body.chargedToYear ?? body.startDate.getFullYear();
  const balance = await getEmployeeBalance(request.employeeId, updateTargetYear);
  const availableWithCurrent = balance.available + request.daysRequested;
  if (days > availableWithCurrent) {
    throw ApiError.badRequest(
      `Saldo insuficiente: solicita ${days} días pero sólo dispone de ${availableWithCurrent}`,
    );
  }

  const updated = await prisma.vacationRequest.update({
    where: { id: request.id },
    data: {
      startDate: body.startDate,
      endDate: body.endDate,
      daysRequested: days,
      chargedToYear: updateTargetYear,
      reason: body.reason ?? null,
      status: RequestStatus.PENDING,
    },
    include: requestInclude,
  });

  await recordAudit({ action: 'UPDATE', entity: 'VacationRequest', entityId: request.id, userId: req.user!.sub, metadata: { employee: `${request.employee.firstName} ${request.employee.lastName}`, startDate: toDateString(body.startDate), endDate: toDateString(body.endDate), days, previousStart: toDateString(request.startDate), previousEnd: toDateString(request.endDate) } });
  res.json(updated);
}

export async function remove(req: Request, res: Response) {
  const request = await prisma.vacationRequest.findUnique({ where: { id: req.params.id } });
  if (!request) throw ApiError.notFound('Solicitud no encontrada');

  const isOwner = request.employeeId === req.user!.employeeId;
  const isAdmin = req.user!.role === Role.ADMIN;
  if (!isAdmin && !isOwner) throw ApiError.forbidden();
  // Un empleado sólo puede cancelar solicitudes pendientes.
  if (!isAdmin && request.status !== RequestStatus.PENDING) {
    throw ApiError.badRequest('Sólo puedes cancelar solicitudes pendientes');
  }

  const reqWithEmployee = await prisma.vacationRequest.findUnique({ where: { id: request.id }, include: { employee: true } });
  await prisma.vacationRequest.delete({ where: { id: request.id } });
  await recordAudit({ action: 'DELETE', entity: 'VacationRequest', entityId: request.id, userId: req.user!.sub, metadata: { employee: reqWithEmployee ? `${reqWithEmployee.employee.firstName} ${reqWithEmployee.employee.lastName}` : undefined, startDate: toDateString(request.startDate), endDate: toDateString(request.endDate), days: request.daysRequested } });
  res.status(204).send();
}
