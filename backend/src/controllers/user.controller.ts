import { Request, Response } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { recordAudit } from '../services/audit.service';

export const updateRoleSchema = z.object({
  role: z.nativeEnum(Role),
  managedDepartmentId: z.string().uuid().nullable().optional(),
});

/** Lista todos los usuarios con info del empleado vinculado y sector administrado. */
export async function list(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    include: {
      employee: { select: { firstName: true, lastName: true, position: true } },
      managedDepartment: { select: { id: true, name: true } },
    },
    orderBy: { email: 'asc' },
  });
  res.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      employeeId: u.employeeId,
      employeeName: u.employee ? `${u.employee.firstName} ${u.employee.lastName}` : null,
      employeePosition: u.employee?.position ?? null,
      managedDepartmentId: u.managedDepartmentId,
      managedDepartmentName: u.managedDepartment?.name ?? null,
    })),
  );
}

/** Actualiza el rol y sector administrado de un usuario (solo ADMIN). */
export async function updateRole(req: Request, res: Response) {
  const { role, managedDepartmentId } = req.body as z.infer<typeof updateRoleSchema>;
  const userId = req.params.id;

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw ApiError.notFound('Usuario no encontrado');

  // Evitar que el último admin sea degradado
  if (target.role === Role.ADMIN && role !== Role.ADMIN) {
    const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
    if (adminCount <= 1) throw ApiError.badRequest('Debe existir al menos un administrador');
  }

  // Verificar que el departamento exista si se asigna rol MANAGER
  if (role === Role.MANAGER && managedDepartmentId) {
    const dept = await prisma.department.findUnique({ where: { id: managedDepartmentId } });
    if (!dept) throw ApiError.notFound('Sector no encontrado');
  }

  // managedDepartmentId solo aplica para MANAGER; limpiar para otros roles
  const deptId = role === Role.MANAGER ? (managedDepartmentId ?? null) : null;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role, managedDepartmentId: deptId },
    include: { managedDepartment: { select: { id: true, name: true } } },
  });

  await recordAudit({
    action: 'UPDATE',
    entity: 'User',
    entityId: userId,
    userId: req.user!.sub,
    metadata: { email: target.email, previousRole: target.role, newRole: role, managedDepartmentId: deptId },
  });

  res.json({
    id: updated.id,
    email: updated.email,
    role: updated.role,
    managedDepartmentId: updated.managedDepartmentId,
    managedDepartmentName: updated.managedDepartment?.name ?? null,
  });
}
