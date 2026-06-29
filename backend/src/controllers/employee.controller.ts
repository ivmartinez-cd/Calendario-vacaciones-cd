import { Request, Response } from 'express';
import { z } from 'zod';
import { EmployeeStatus, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { hashPassword } from '../utils/password';
import { recordAudit } from '../services/audit.service';
import { getEmployeeBalance } from '../services/vacation.service';
import { recalculateCyclesOnHireDateChange } from '../services/cycle.service';
import { calculateVacationDays, SeniorityTier } from '../utils/dates';

async function getSeniorityTiers(): Promise<SeniorityTier[] | undefined> {
  const config = await prisma.systemConfig.findUnique({ where: { id: 'singleton' } });
  if (!config) return undefined;
  const tiers = config.seniorityTiers as unknown;
  if (Array.isArray(tiers) && tiers.length > 0) return tiers as SeniorityTier[];
  return undefined;
}

const EMPLOYEE_PALETTE = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
  '#e11d48', '#84cc16', '#0ea5e9', '#a855f7', '#d946ef',
  '#22d3ee',
];

function randomEmployeeColor(): string {
  return EMPLOYEE_PALETTE[Math.floor(Math.random() * EMPLOYEE_PALETTE.length)];
}

const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial');

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  departmentId: z.string().uuid(),
  positionId: z.string().uuid(),
  hireDate: z.coerce.date(),
  annualVacationDays: z.coerce.number().int().min(0).max(365).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.ACTIVE),
  createAccount: z.boolean().optional(),
  password: z.preprocess((v) => (v === '' ? undefined : v), z.string().min(8).optional()),
});

export const updateEmployeeSchema = createEmployeeSchema
  .partial()
  .omit({ createAccount: true, password: true })
  .extend({
    createAccount: z.boolean().optional(),
    changePassword: z.boolean().optional(),
    password: z.preprocess((v) => (v === '' ? undefined : v), passwordSchema.optional()),
  });

export async function list(req: Request, res: Response) {
  const { search, departmentId, status } = req.query as Record<string, string | undefined>;
  const { role, managedDepartmentId } = req.user!;
  const isManager = role === Role.MANAGER;

  // MANAGER: forzar filtro por su sector; ignorar el query param departmentId
  const effectiveDepartmentId = isManager ? managedDepartmentId : departmentId;

  const employees = await prisma.employee.findMany({
    where: {
      AND: [
        effectiveDepartmentId ? { departmentId: effectiveDepartmentId } : {},
        status ? { status: status as EmployeeStatus } : {},
        search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { position: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {},
      ],
    },
    include: { department: true, position: true, user: { select: { id: true } } },
    orderBy: [{ firstName: 'asc' }],
  });

  // Adjuntar saldo de cada empleado
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const withBalance = await Promise.all(
    employees.map(async (e) => {
      const { user, ...empData } = e;
      const balance = await getEmployeeBalance(e.id, currentYear);
      const nextYearBalance = await getEmployeeBalance(e.id, nextYear);
      return {
        ...empData,
        balance,
        nextYearBalance: nextYearBalance.cycleOpen ? nextYearBalance : null,
        hasUser: !!user,
      };
    }),
  );
  res.json(withBalance);
}

export async function getById(req: Request, res: Response) {
  const employee = await prisma.employee.findUnique({
    where: { id: req.params.id },
    include: { department: true, position: true, vacationRequests: { orderBy: { startDate: 'desc' } } },
  });
  if (!employee) throw ApiError.notFound('Empleado no encontrado');

  // MANAGER: solo puede consultar empleados de su sector
  if (req.user!.role === Role.MANAGER && employee.departmentId !== req.user!.managedDepartmentId) {
    throw ApiError.forbidden('Solo puedes consultar empleados de tu sector');
  }

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const balance = await getEmployeeBalance(employee.id, currentYear);
  const nextYearBalance = await getEmployeeBalance(employee.id, nextYear);
  res.json({
    ...employee,
    balance,
    nextYearBalance: nextYearBalance.cycleOpen ? nextYearBalance : null,
  });
}

export async function getVacations(req: Request, res: Response) {
  const employee = await prisma.employee.findUnique({ where: { id: req.params.id } });
  if (!employee) throw ApiError.notFound('Empleado no encontrado');

  const requests = await prisma.vacationRequest.findMany({
    where: { employeeId: req.params.id },
    orderBy: { startDate: 'desc' },
  });
  res.json(requests);
}

export async function create(req: Request, res: Response) {
  const { createAccount, password, ...data } = req.body as z.infer<typeof createEmployeeSchema>;

  const tiers = await getSeniorityTiers();
  data.annualVacationDays = calculateVacationDays(data.hireDate, tiers);
  if (!data.color) data.color = randomEmployeeColor();

  const employee = await prisma.employee.create({ data });

  if (createAccount) {
    await prisma.user.create({
      data: {
        email: data.email,
        password: await hashPassword(password ?? 'Empleado123!'),
        role: Role.EMPLOYEE,
        employeeId: employee.id,
      },
    });
  }

  await recordAudit({ action: 'CREATE', entity: 'Employee', entityId: employee.id, userId: req.user!.sub, metadata: { employee: `${data.firstName} ${data.lastName}`, email: data.email } });
  res.status(201).json(employee);
}

export async function update(req: Request, res: Response) {
  const { createAccount, changePassword, password, ...data } = req.body as z.infer<typeof updateEmployeeSchema>;

  if (data.hireDate) {
    const tiers = await getSeniorityTiers();
    data.annualVacationDays = calculateVacationDays(data.hireDate, tiers);
  }

  const existing = await prisma.employee.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { id: true } } },
  });
  if (!existing) throw ApiError.notFound('Empleado no encontrado');

  const employee = await prisma.employee.update({ where: { id: req.params.id }, data });

  if (data.hireDate) {
    await recalculateCyclesOnHireDateChange(employee.id, data.hireDate);
  }

  // Si cambió el email y el empleado tiene cuenta de usuario, sincronizar User.email
  if (data.email && existing.user && data.email !== existing.email) {
    await prisma.user.update({
      where: { id: existing.user.id },
      data: { email: data.email },
    });
  }

  if (createAccount && !existing.user) {
    if (!password) throw ApiError.badRequest('Se requiere una contraseña para crear la cuenta');
    await prisma.user.create({
      data: {
        email: employee.email,
        password: await hashPassword(password),
        role: Role.EMPLOYEE,
        employeeId: employee.id,
      },
    });
  }

  if (changePassword && existing.user) {
    if (!password) throw ApiError.badRequest('Se requiere una contraseña para cambiarla');
    await prisma.user.update({
      where: { id: existing.user.id },
      data: { password: await hashPassword(password) },
    });
  }

  const auditMeta: Record<string, unknown> = {
    employee: `${employee.firstName} ${employee.lastName}`,
    changes: Object.keys(data),
  };
  if (createAccount && !existing.user) auditMeta.credentialsCreated = true;
  if (changePassword && existing.user) auditMeta.passwordChanged = true;

  await recordAudit({ action: 'UPDATE', entity: 'Employee', entityId: employee.id, userId: req.user!.sub, metadata: auditMeta });
  res.json({ ...employee, hasUser: (createAccount && !existing.user) ? true : !!existing.user });
}

export async function remove(req: Request, res: Response) {
  const employee = await prisma.employee.findUnique({ where: { id: req.params.id }, include: { user: true } });
  if (!employee) throw ApiError.notFound('Empleado no encontrado');

  if (employee.user?.role === Role.MANAGER && employee.user.managedDepartmentId) {
    throw ApiError.conflict('Este empleado es jefe de sector. Reasigná el rol antes de eliminar.');
  }

  await prisma.$transaction(async (tx) => {
    if (employee.user) {
      await tx.user.delete({ where: { id: employee.user.id } });
    }
    await tx.employee.delete({ where: { id: req.params.id } });
  });

  await recordAudit({ action: 'DELETE', entity: 'Employee', entityId: req.params.id, userId: req.user!.sub, metadata: { employee: `${employee.firstName} ${employee.lastName}` } });
  res.status(204).send();
}
