import { Request, Response } from 'express';
import { EmployeeStatus, RequestStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { getEmployeeBalance } from '../services/vacation.service';

/** Métricas del dashboard principal. */
export async function summary(_req: Request, res: Response) {
  const now = new Date();

  const [totalEmployees, activeEmployees, pendingRequests, onVacationRequests, employees] =
    await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: EmployeeStatus.ACTIVE } }),
      prisma.vacationRequest.count({ where: { status: RequestStatus.PENDING } }),
      prisma.vacationRequest.findMany({
        where: { status: RequestStatus.APPROVED, startDate: { lte: now }, endDate: { gte: now } },
        include: { employee: { include: { department: true } } },
      }),
      prisma.employee.findMany({ where: { status: EmployeeStatus.ACTIVE } }),
    ]);

  // Agregado de días usados/disponibles del año en curso.
  let totalAnnual = 0;
  let totalUsed = 0;
  let totalPending = 0;
  for (const e of employees) {
    const b = await getEmployeeBalance(e.id);
    totalAnnual += b.annual;
    totalUsed += b.used;
    totalPending += b.pending;
  }

  res.json({
    totalEmployees,
    activeEmployees,
    pendingRequests,
    onVacationCount: onVacationRequests.length,
    onVacation: onVacationRequests.map((r) => ({
      id: r.id,
      employee: `${r.employee.firstName} ${r.employee.lastName}`,
      department: r.employee.department.name,
      color: r.employee.department.color,
      endDate: r.endDate,
    })),
    days: {
      annual: totalAnnual,
      used: totalUsed,
      pending: totalPending,
      available: totalAnnual - totalUsed - totalPending,
    },
  });
}
