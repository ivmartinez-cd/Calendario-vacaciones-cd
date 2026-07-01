import { Request, Response } from 'express';
import { z } from 'zod';
import { AbsenceType, RequestStatus, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { calendarDaysBetween, toDateString } from '../utils/dates';
import { recordAudit } from '../services/audit.service';

export const createAbsenceSchema = z
  .object({
    employeeId: z.string().uuid().optional(), // empleado usa el suyo si no se indica
    employeeIds: z.array(z.string().uuid()).optional(), // alta masiva (admin)
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    type: z.nativeEnum(AbsenceType),
    reason: z.string().max(500).optional().nullable(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: 'La fecha de fin debe ser posterior o igual a la de inicio',
    path: ['endDate'],
  });

export const updateAbsenceSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    type: z.nativeEnum(AbsenceType),
    reason: z.string().max(500).optional().nullable(),
    status: z.nativeEnum(RequestStatus).optional(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: 'La fecha de fin debe ser posterior o igual a la de inicio',
    path: ['endDate'],
  });

const absenceInclude = {
  employee: { include: { department: true } },
};

/** Lista bajas. Los empleados sólo ven las suyas; managers ven su sector; admins ven todo. */
export async function list(req: Request, res: Response) {
  const { status, employeeId, type, from, to } = req.query as Record<string, string | undefined>;
  const { role, managedDepartmentId } = req.user!;
  const isAdmin = role === Role.ADMIN;
  const isManager = role === Role.MANAGER;

  const where: Record<string, unknown> = {};
  if (isAdmin) {
    if (employeeId) where.employeeId = employeeId;
  } else if (isManager) {
    where.employee = {
      departmentId: managedDepartmentId,
      OR: [
        {
          NOT: {
            user: {
              role: { in: [Role.MANAGER, Role.ADMIN] }
            }
          }
        },
        { id: req.user!.employeeId ?? '' }
      ]
    };
    if (employeeId) where.employeeId = employeeId;
  } else {
    where.employeeId = req.user!.employeeId;
  }
  if (status) where.status = status as RequestStatus;
  if (type) where.type = type as AbsenceType;
  if (from || to) {
    where.startDate = {};
    if (from) (where.startDate as Record<string, Date>).gte = new Date(from);
    if (to) (where.startDate as Record<string, Date>).lte = new Date(to);
  }

  const absences = await prisma.absence.findMany({
    where,
    include: absenceInclude,
    orderBy: { startDate: 'desc' },
  });
  res.json(absences);
}

export async function getById(req: Request, res: Response) {
  const absence = await prisma.absence.findUnique({
    where: { id: req.params.id },
    include: absenceInclude,
  });
  if (!absence) throw ApiError.notFound('Baja no encontrada');
  const { role, managedDepartmentId, employeeId } = req.user!;
  const isAdmin = role === Role.ADMIN;
  const isManager = role === Role.MANAGER;
  const isOwner = absence.employeeId === employeeId;
  const isManagedDept = isManager && absence.employee.departmentId === managedDepartmentId;
  if (!isAdmin && !isOwner && !isManagedDept) throw ApiError.forbidden();
  res.json(absence);
}

/** Verifica que no haya bajas del mismo tipo ni vacaciones solapadas para el empleado. */
async function assertNoOverlap(employeeId: string, startDate: Date, endDate: Date, type: AbsenceType, excludeId?: string) {
  const overlappingAbsence = await prisma.absence.findFirst({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      employeeId,
      type,
      status: { in: [RequestStatus.APPROVED, RequestStatus.PENDING] },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });
  if (overlappingAbsence) {
    throw ApiError.conflict('Ya existe una baja del mismo tipo que se solapa con esas fechas');
  }

  const overlappingVacation = await prisma.vacationRequest.findFirst({
    where: {
      employeeId,
      status: { in: [RequestStatus.APPROVED, RequestStatus.PENDING] },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });
  if (overlappingVacation) {
    throw ApiError.conflict('Ya existe una solicitud de vacaciones que se solapa con esas fechas');
  }
}

export async function create(req: Request, res: Response) {
  const body = req.body as z.infer<typeof createAbsenceSchema>;
  const isAdmin = req.user!.role === Role.ADMIN;

  const targetEmployeeIds = isAdmin
    ? body.employeeIds && body.employeeIds.length > 0
      ? body.employeeIds
      : body.employeeId
        ? [body.employeeId]
        : []
    : req.user!.employeeId
      ? [req.user!.employeeId]
      : [];

  if (targetEmployeeIds.length === 0) throw ApiError.badRequest('No se ha indicado ningún empleado');

  const employees = await prisma.employee.findMany({ where: { id: { in: targetEmployeeIds } } });
  if (employees.length !== targetEmployeeIds.length) throw ApiError.notFound('Uno o más empleados no fueron encontrados');

  const days = calendarDaysBetween(body.startDate, body.endDate);
  if (days <= 0) throw ApiError.badRequest('El rango de fechas no es válido');

  const status = isAdmin ? RequestStatus.APPROVED : RequestStatus.PENDING;

  for (const employeeId of targetEmployeeIds) {
    await assertNoOverlap(employeeId, body.startDate, body.endDate, body.type);
  }

  const created = await Promise.all(
    targetEmployeeIds.map((employeeId) =>
      prisma.absence.create({
        data: {
          employeeId,
          startDate: body.startDate,
          endDate: body.endDate,
          daysCount: days,
          type: body.type,
          reason: body.reason ?? null,
          status,
        },
        include: absenceInclude,
      }),
    ),
  );

  for (const absence of created) {
    await recordAudit({
      action: 'CREATE',
      entity: 'Absence',
      entityId: absence.id,
      userId: req.user!.sub,
      metadata: {
        employee: `${absence.employee.firstName} ${absence.employee.lastName}`,
        type: absence.type,
        startDate: toDateString(body.startDate),
        endDate: toDateString(body.endDate),
        days,
      },
    });
  }

  res.status(201).json(created.length === 1 ? created[0] : created);
}

export async function update(req: Request, res: Response) {
  const body = req.body as z.infer<typeof updateAbsenceSchema>;
  const absence = await prisma.absence.findUnique({ where: { id: req.params.id }, include: absenceInclude });
  if (!absence) throw ApiError.notFound('Baja no encontrada');

  const isOwner = absence.employeeId === req.user!.employeeId;
  const isAdmin = req.user!.role === Role.ADMIN;
  if (!isAdmin && !isOwner) throw ApiError.forbidden();
  if (!isAdmin && absence.status !== RequestStatus.PENDING) {
    throw ApiError.badRequest('Sólo puedes editar bajas pendientes');
  }
  if (body.status && !isAdmin) {
    throw ApiError.forbidden('Sólo un administrador puede cambiar el estado');
  }

  const days = calendarDaysBetween(body.startDate, body.endDate);
  if (days <= 0) throw ApiError.badRequest('El rango de fechas no es válido');

  const datesOrTypeChanged =
    body.type !== absence.type ||
    body.startDate.getTime() !== absence.startDate.getTime() ||
    body.endDate.getTime() !== absence.endDate.getTime();
  if (datesOrTypeChanged) {
    await assertNoOverlap(absence.employeeId, body.startDate, body.endDate, body.type, absence.id);
  }

  const updated = await prisma.absence.update({
    where: { id: absence.id },
    data: {
      startDate: body.startDate,
      endDate: body.endDate,
      daysCount: days,
      type: body.type,
      reason: body.reason ?? null,
      status: body.status ?? absence.status,
    },
    include: absenceInclude,
  });

  await recordAudit({
    action: 'UPDATE',
    entity: 'Absence',
    entityId: absence.id,
    userId: req.user!.sub,
    metadata: {
      employee: `${absence.employee.firstName} ${absence.employee.lastName}`,
      type: updated.type,
      startDate: toDateString(body.startDate),
      endDate: toDateString(body.endDate),
      days,
      status: updated.status,
    },
  });

  res.json(updated);
}

export async function remove(req: Request, res: Response) {
  const absence = await prisma.absence.findUnique({ where: { id: req.params.id }, include: absenceInclude });
  if (!absence) throw ApiError.notFound('Baja no encontrada');

  const isOwner = absence.employeeId === req.user!.employeeId;
  const isAdmin = req.user!.role === Role.ADMIN;
  if (!isAdmin && !isOwner) throw ApiError.forbidden();
  if (!isAdmin && absence.status !== RequestStatus.PENDING) {
    throw ApiError.badRequest('Sólo puedes cancelar bajas pendientes');
  }

  await prisma.absence.delete({ where: { id: absence.id } });
  await recordAudit({
    action: 'DELETE',
    entity: 'Absence',
    entityId: absence.id,
    userId: req.user!.sub,
    metadata: {
      employee: `${absence.employee.firstName} ${absence.employee.lastName}`,
      type: absence.type,
      startDate: toDateString(absence.startDate),
      endDate: toDateString(absence.endDate),
    },
  });
  res.status(204).send();
}
