import { Request, Response } from 'express';
import { z } from 'zod';
import { EmployeeStatus, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { hashPassword } from '../utils/password';
import { recordAudit } from '../services/audit.service';
import { getEmployeeBalance } from '../services/vacation.service';
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

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  departmentId: z.string().uuid(),
  position: z.string().min(1),
  hireDate: z.coerce.date(),
  annualVacationDays: z.coerce.number().int().min(0).max(365).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.ACTIVE),
  createAccount: z.boolean().optional(),
  password: z.preprocess((v) => (v === '' ? undefined : v), z.string().min(8).optional()),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().omit({ createAccount: true, password: true });

export async function list(req: Request, res: Response) {
  const { search, departmentId, status } = req.query as Record<string, string | undefined>;

  const employees = await prisma.employee.findMany({
    where: {
      AND: [
        departmentId ? { departmentId } : {},
        status ? { status: status as EmployeeStatus } : {},
        search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { position: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    },
    include: { department: true },
    orderBy: [{ firstName: 'asc' }],
  });

  // Adjuntar saldo de cada empleado
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const withBalance = await Promise.all(
    employees.map(async (e) => {
      const balance = await getEmployeeBalance(e.id, currentYear);
      const nextYearBalance = await getEmployeeBalance(e.id, nextYear);
      return {
        ...e,
        balance,
        nextYearBalance: nextYearBalance.cycleOpen ? nextYearBalance : null,
      };
    }),
  );
  res.json(withBalance);
}

export async function getById(req: Request, res: Response) {
  const employee = await prisma.employee.findUnique({
    where: { id: req.params.id },
    include: { department: true, vacationRequests: { orderBy: { startDate: 'desc' } } },
  });
  if (!employee) throw ApiError.notFound('Empleado no encontrado');
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
  const data = req.body as z.infer<typeof updateEmployeeSchema>;
  if (data.hireDate) {
    const tiers = await getSeniorityTiers();
    data.annualVacationDays = calculateVacationDays(data.hireDate, tiers);
  }
  const employee = await prisma.employee.update({ where: { id: req.params.id }, data });
  await recordAudit({ action: 'UPDATE', entity: 'Employee', entityId: employee.id, userId: req.user!.sub, metadata: { employee: `${employee.firstName} ${employee.lastName}`, changes: Object.keys(data) } });
  res.json(employee);
}

export async function remove(req: Request, res: Response) {
  const employee = await prisma.employee.findUnique({ where: { id: req.params.id }, include: { user: true } });
  if (!employee) throw ApiError.notFound('Empleado no encontrado');

  await prisma.$transaction(async (tx) => {
    if (employee.user) {
      await tx.user.delete({ where: { id: employee.user.id } });
    }
    await tx.employee.delete({ where: { id: req.params.id } });
  });

  await recordAudit({ action: 'DELETE', entity: 'Employee', entityId: req.params.id, userId: req.user!.sub, metadata: { employee: `${employee.firstName} ${employee.lastName}` } });
  res.status(204).send();
}
