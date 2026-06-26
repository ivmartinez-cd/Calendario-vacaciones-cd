import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export const createExclusionSchema = z
  .object({
    employeeAId: z.string().uuid(),
    employeeBId: z.string().uuid(),
  })
  .refine((d) => d.employeeAId !== d.employeeBId, {
    message: 'Los empleados deben ser distintos',
    path: ['employeeBId'],
  });

export const upsertPositionLimitSchema = z.object({
  position: z.string().min(1).max(200),
  maxEmployees: z.number().int().min(1),
});

const employeeSelect = { id: true, firstName: true, lastName: true, position: true };

export async function listExclusions(_req: Request, res: Response) {
  const exclusions = await prisma.vacationExclusion.findMany({
    include: {
      employeeA: { select: employeeSelect },
      employeeB: { select: employeeSelect },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(exclusions);
}

export async function createExclusion(req: Request, res: Response) {
  const body = req.body as z.infer<typeof createExclusionSchema>;

  // Ordenar lexicográficamente para evitar duplicados (A,B) y (B,A)
  const [aId, bId] = [body.employeeAId, body.employeeBId].sort();

  const [empA, empB] = await Promise.all([
    prisma.employee.findUnique({ where: { id: aId } }),
    prisma.employee.findUnique({ where: { id: bId } }),
  ]);
  if (!empA || empA.status === 'INACTIVE') throw ApiError.badRequest('El empleado A no existe o está inactivo');
  if (!empB || empB.status === 'INACTIVE') throw ApiError.badRequest('El empleado B no existe o está inactivo');

  const exclusion = await prisma.vacationExclusion.create({
    data: { employeeAId: aId, employeeBId: bId },
    include: {
      employeeA: { select: employeeSelect },
      employeeB: { select: employeeSelect },
    },
  });
  res.status(201).json(exclusion);
}

export async function deleteExclusion(req: Request, res: Response) {
  const exclusion = await prisma.vacationExclusion.findUnique({ where: { id: req.params.id } });
  if (!exclusion) throw ApiError.notFound('Exclusión no encontrada');
  await prisma.vacationExclusion.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

export async function listPositionLimits(_req: Request, res: Response) {
  const limits = await prisma.positionOverlapLimit.findMany({ orderBy: { position: 'asc' } });
  res.json(limits);
}

export async function upsertPositionLimit(req: Request, res: Response) {
  const body = req.body as z.infer<typeof upsertPositionLimitSchema>;
  const limit = await prisma.positionOverlapLimit.upsert({
    where: { position: body.position },
    create: { position: body.position, maxEmployees: body.maxEmployees },
    update: { maxEmployees: body.maxEmployees },
  });
  res.json(limit);
}

export async function deletePositionLimit(req: Request, res: Response) {
  const limit = await prisma.positionOverlapLimit.findUnique({ where: { id: req.params.id } });
  if (!limit) throw ApiError.notFound('Límite de cargo no encontrado');
  await prisma.positionOverlapLimit.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
