import { Request, Response } from 'express';
import { EmployeeStatus, RequestStatus, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { getEmployeeBalance } from '../services/vacation.service';

function mapOnVacation(requests: { id: string; endDate: Date; employee: { firstName: string; lastName: string; department: { name: string; color: string } } }[]) {
  return requests.map((r) => ({
    id: r.id,
    employee: `${r.employee.firstName} ${r.employee.lastName}`,
    department: r.employee.department.name,
    color: r.employee.department.color,
    endDate: r.endDate,
  }));
}

/** Métricas del dashboard principal. */
export async function summary(req: Request, res: Response) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;
  const { role, managedDepartmentId, employeeId } = req.user!;

  // ── MANAGER: métricas acotadas al sector ──────────────────────────────────
  if (role === Role.MANAGER) {
    const deptFilter = { departmentId: managedDepartmentId ?? undefined };
    const vacFilter = { employee: { departmentId: managedDepartmentId ?? undefined } };

    const [totalEmployees, activeEmployees, pendingRequests, onVacationRequests, sectorEmployees] =
      await Promise.all([
        prisma.employee.count({ where: deptFilter }),
        prisma.employee.count({ where: { ...deptFilter, status: EmployeeStatus.ACTIVE } }),
        prisma.vacationRequest.count({ where: { status: RequestStatus.PENDING, ...vacFilter } }),
        prisma.vacationRequest.findMany({
          where: { status: RequestStatus.APPROVED, startDate: { lte: now }, endDate: { gte: now }, ...vacFilter },
          include: { employee: { include: { department: true } } },
        }),
        prisma.employee.findMany({ where: { ...deptFilter, status: EmployeeStatus.ACTIVE } }),
      ]);

    // Balance personal del manager (también es empleado)
    let days: any = { annual: 0, used: 0, pending: 0, carryOver: 0, available: 0, cycleOpen: false };
    let nextYearDays: any = null;
    if (employeeId) {
      days = await getEmployeeBalance(employeeId, currentYear);
      const nextBal = await getEmployeeBalance(employeeId, nextYear);
      if (nextBal.cycleOpen) nextYearDays = nextBal;
    }

    return res.json({ totalEmployees, activeEmployees, pendingRequests, onVacationCount: onVacationRequests.length, onVacation: mapOnVacation(onVacationRequests), days, nextYearDays });
  }

  // ── ADMIN: métricas globales ──────────────────────────────────────────────
  const [totalEmployees, activeEmployees, pendingRequests, onVacationRequests, allActive] =
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

  let days: any;
  let nextYearDays: any = null;

  if (role === Role.ADMIN) {
    let totalAnnual = 0, totalUsed = 0, totalPending = 0, totalCarryOver = 0, totalAvailable = 0;
    for (const e of allActive) {
      const b = await getEmployeeBalance(e.id, currentYear);
      totalAnnual += b.annual;
      totalUsed += b.used;
      totalPending += b.pending;
      totalCarryOver += b.carryOver;
      totalAvailable += b.available;
    }
    days = { annual: totalAnnual, used: totalUsed, pending: totalPending, carryOver: totalCarryOver, available: totalAvailable, cycleOpen: true };
  } else if (employeeId) {
    // EMPLOYEE: saldo propio
    days = await getEmployeeBalance(employeeId, currentYear);
    const nextBal = await getEmployeeBalance(employeeId, nextYear);
    if (nextBal.cycleOpen) nextYearDays = nextBal;
  } else {
    days = { annual: 0, used: 0, pending: 0, available: 0, cycleOpen: false };
  }

  res.json({ totalEmployees, activeEmployees, pendingRequests, onVacationCount: onVacationRequests.length, onVacation: mapOnVacation(onVacationRequests), days, nextYearDays });
}
