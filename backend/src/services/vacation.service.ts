import { RequestStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { calculateVacationDays, SeniorityTier } from '../utils/dates';

export interface VacationBalance {
  annual: number;
  used: number;
  pending: number;
  available: number;
}

async function getSeniorityTiers(): Promise<SeniorityTier[] | undefined> {
  const config = await prisma.systemConfig.findUnique({ where: { id: 'singleton' } });
  if (!config) return undefined;
  const tiers = config.seniorityTiers as unknown;
  if (Array.isArray(tiers) && tiers.length > 0) return tiers as SeniorityTier[];
  return undefined;
}

export async function getEmployeeBalance(
  employeeId: string,
  year = new Date().getFullYear(),
): Promise<VacationBalance> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  const tiers = await getSeniorityTiers();
  const annual = employee?.hireDate
    ? calculateVacationDays(employee.hireDate, tiers)
    : employee?.annualVacationDays ?? 0;

  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

  const requests = await prisma.vacationRequest.findMany({
    where: {
      employeeId,
      status: { in: [RequestStatus.APPROVED, RequestStatus.PENDING] },
      startDate: { gte: yearStart, lte: yearEnd },
    },
  });

  let used = 0;
  let pending = 0;
  for (const r of requests) {
    if (r.status === RequestStatus.APPROVED) used += r.daysRequested;
    else if (r.status === RequestStatus.PENDING) pending += r.daysRequested;
  }

  return { annual, used, pending, available: annual - used - pending };
}
