import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { recordAudit } from '../services/audit.service';

export const departmentSchema = z.object({
  name: z.string().min(2),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, 'El color debe ser un hex válido (#rrggbb)')
    .default('#3b82f6'),
});

export async function list(_req: Request, res: Response) {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true } } },
  });
  res.json(departments);
}

export async function create(req: Request, res: Response) {
  const data = req.body as z.infer<typeof departmentSchema>;
  const department = await prisma.department.create({ data });
  await recordAudit({ action: 'CREATE', entity: 'Department', entityId: department.id, userId: req.user!.sub, metadata: { name: department.name } });
  res.status(201).json(department);
}

export async function update(req: Request, res: Response) {
  const data = req.body as z.infer<typeof departmentSchema>;
  const department = await prisma.department.update({ where: { id: req.params.id }, data });
  await recordAudit({ action: 'UPDATE', entity: 'Department', entityId: department.id, userId: req.user!.sub, metadata: { name: department.name } });
  res.json(department);
}

export async function remove(req: Request, res: Response) {
  const [employeeCount, managerCount] = await Promise.all([
    prisma.employee.count({ where: { departmentId: req.params.id } }),
    prisma.user.count({ where: { managedDepartmentId: req.params.id } }),
  ]);
  if (employeeCount > 0) throw ApiError.conflict('No se puede eliminar un departamento con empleados asignados');
  if (managerCount > 0) throw ApiError.conflict('No se puede eliminar un departamento con jefes de sector asignados');
  const dept = await prisma.department.findUnique({ where: { id: req.params.id } });
  await prisma.department.delete({ where: { id: req.params.id } });
  await recordAudit({ action: 'DELETE', entity: 'Department', entityId: req.params.id, userId: req.user!.sub, metadata: { name: dept?.name } });
  res.status(204).send();
}
