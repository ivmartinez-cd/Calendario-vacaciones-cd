import { Request, Response } from 'express';
import { EmployeeStatus, RequestStatus, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { getEmployeeBalance } from '../services/vacation.service';

/** Métricas del dashboard principal. */
export async function summary(req: Request, res: Response) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;

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

  let days: any;
  let nextYearDays: any = null;

  if (req.user?.role === Role.ADMIN) {
    // Admin: sum of all employees
    let totalAnnual = 0;
    let totalUsed = 0;
    let totalPending = 0;
    let totalCarryOver = 0;
    let totalAvailable = 0;
    for (const e of employees) {
      const b = await getEmployeeBalance(e.id, currentYear);
      totalAnnual += b.annual;
      totalUsed += b.used;
      totalPending += b.pending;
      totalCarryOver += b.carryOver;
      totalAvailable += b.available;
    }
    days = {
      annual: totalAnnual,
      used: totalUsed,
      pending: totalPending,
      carryOver: totalCarryOver,
      available: totalAvailable,
      cycleOpen: true,
    };
  } else if (req.user?.employeeId) {
    // Employee: their own balance
    days = await getEmployeeBalance(req.user.employeeId, currentYear);
    const nextBal = await getEmployeeBalance(req.user.employeeId, nextYear);
    if (nextBal.cycleOpen) {
      nextYearDays = nextBal;
    }
  } else {
    days = {
      annual: 0,
      used: 0,
      pending: 0,
      available: 0,
      cycleOpen: false,
    };
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
    days,
    nextYearDays,
  });
}
