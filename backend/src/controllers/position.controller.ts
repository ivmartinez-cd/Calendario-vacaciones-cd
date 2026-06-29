import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { recordAudit } from '../services/audit.service';

export const positionSchema = z.object({
  name: z.string().min(2),
});

export async function list(_req: Request, res: Response) {
  const positions = await prisma.position.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true } } },
  });
  res.json(positions);
}

export async function create(req: Request, res: Response) {
  const data = req.body as z.infer<typeof positionSchema>;
  
  const existing = await prisma.position.findUnique({ where: { name: data.name } });
  if (existing) {
    throw ApiError.conflict('Ya existe un cargo con este nombre');
  }

  const position = await prisma.position.create({ data });
  await recordAudit({ action: 'CREATE', entity: 'Position', entityId: position.id, userId: req.user!.sub, metadata: { name: position.name } });
  res.status(201).json(position);
}

export async function update(req: Request, res: Response) {
  const data = req.body as z.infer<typeof positionSchema>;
  
  const existing = await prisma.position.findUnique({ where: { name: data.name } });
  if (existing && existing.id !== req.params.id) {
    throw ApiError.conflict('Ya existe otro cargo con este nombre');
  }

  const position = await prisma.position.update({ where: { id: req.params.id }, data });
  await recordAudit({ action: 'UPDATE', entity: 'Position', entityId: position.id, userId: req.user!.sub, metadata: { name: position.name } });
  res.json(position);
}

export async function remove(req: Request, res: Response) {
  const employeeCount = await prisma.employee.count({ where: { positionId: req.params.id } });
  if (employeeCount > 0) throw ApiError.conflict('No se puede eliminar un cargo con empleados asignados');
  
  const pos = await prisma.position.findUnique({ where: { id: req.params.id } });
  await prisma.position.delete({ where: { id: req.params.id } });
  await recordAudit({ action: 'DELETE', entity: 'Position', entityId: req.params.id, userId: req.user!.sub, metadata: { name: pos?.name } });
  res.status(204).send();
}
