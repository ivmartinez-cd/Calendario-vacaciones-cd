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

/** Lista solicitudes. Los empleados sólo ven las suyas; los admin ven todas (con filtros). */
export async function list(req: Request, res: Response) {
  const { status, employeeId, departmentId, from, to } = req.query as Record<string, string | undefined>;
  const isAdmin = req.user!.role === Role.ADMIN;

  const where: Record<string, unknown> = {};
  if (!isAdmin) {
    where.employeeId = req.user!.employeeId;
  } else {
    if (employeeId) where.employeeId = employeeId;
    if (departmentId) where.employee = { departmentId };
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
  const requests = await prisma.vacationRequest.findMany({
    where: {
      status: { in: [RequestStatus.APPROVED, RequestStatus.PENDING] },
      ...(from || to
        ? { startDate: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}),
    },
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
  if (req.user!.role !== Role.ADMIN && request.employeeId !== req.user!.employeeId) {
    throw ApiError.forbidden();
  }
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

  const days = calendarDaysBetween(body.startDate, body.endDate);
  if (days <= 0) throw ApiError.badRequest('El rango no contiene días laborables');

  // ── Validación de año ──────────────────────────────────────────────────────
  const targetYear = body.startDate.getFullYear();
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
      reason: body.reason ?? null,
      status: RequestStatus.PENDING,
    },
    include: requestInclude,
  });

  await recordAudit({ action: 'CREATE', entity: 'VacationRequest', entityId: request.id, userId: req.user!.sub, metadata: { employee: `${request.employee.firstName} ${request.employee.lastName}`, startDate: toDateString(body.startDate), endDate: toDateString(body.endDate), days } });
  res.status(201).json(request);
}

/** Aprobar o rechazar una solicitud (sólo admin). */
export async function decide(req: Request, res: Response) {
  const { decision, comment } = req.body as z.infer<typeof decisionSchema>;
  const request = await prisma.vacationRequest.findUnique({
    where: { id: req.params.id },
    include: { employee: { include: { user: true } } },
  });
  if (!request) throw ApiError.notFound('Solicitud no encontrada');

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

  const days = calendarDaysBetween(body.startDate, body.endDate);
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

  const balance = await getEmployeeBalance(request.employeeId, body.startDate.getFullYear());
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
