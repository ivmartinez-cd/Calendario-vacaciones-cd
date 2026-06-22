import { prisma } from '../config/prisma';
import { calculateVacationDays, SeniorityTier } from '../utils/dates';
import { RequestStatus } from '@prisma/client';

export interface VacationBalance {
  annual: number;
  carryOver: number;
  used: number;
  pending: number;
  available: number;
  cycleOpen: boolean;
}

async function getSeniorityTiers(): Promise<SeniorityTier[] | undefined> {
  const config = await prisma.systemConfig.findUnique({ where: { id: 'singleton' } });
  if (!config) return undefined;
  const tiers = config.seniorityTiers as unknown;
  if (Array.isArray(tiers) && tiers.length > 0) return tiers as SeniorityTier[];
  return undefined;
}

/**
 * Obtiene o crea el ciclo anual de un empleado para el año indicado.
 * Al crear, calcula los días según antigüedad proyectada a ese año.
 */
export async function ensureCycle(employeeId: string, year: number) {
  const existing = await prisma.vacationCycle.findUnique({
    where: { employeeId_year: { employeeId, year } },
  });
  if (existing) return existing;

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw new Error(`Empleado ${employeeId} no encontrado`);

  const tiers = await getSeniorityTiers();

  // Proyectar la antigüedad al 1 de enero del año objetivo
  const referenceDate = new Date(Date.UTC(year, 0, 1));
  const annualDays = employee.hireDate
    ? calculateVacationDaysAtDate(employee.hireDate, referenceDate, tiers)
    : employee.annualVacationDays;

  // Determinar si el ciclo está abierto
  const config = await prisma.systemConfig.findUnique({ where: { id: 'singleton' } });
  const currentYear = new Date().getFullYear();
  let isOpen = false;

  if (year === currentYear) {
    // El ciclo del año en curso siempre está abierto
    isOpen = true;
  } else if (year === currentYear + 1 && config) {
    // El ciclo del año siguiente se abre según la configuración
    const today = new Date();
    const openMonth = config.nextYearOpenMonth - 1; // 0-indexed
    const openDay = config.nextYearOpenDay;
    const openDate = new Date(Date.UTC(currentYear, openMonth, openDay));
    isOpen = today >= openDate;
  }

  return prisma.vacationCycle.create({
    data: {
      employeeId,
      year,
      annualDays,
      isOpen,
      openedAt: isOpen ? new Date() : null,
    },
  });
}

/**
 * Calcula los días de vacaciones que corresponden al empleado
 * tomando como referencia una fecha específica (para proyecciones futuras).
 */
function calculateVacationDaysAtDate(
  hireDate: Date,
  referenceDate: Date,
  tiers?: SeniorityTier[],
): number {
  const years = (referenceDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const DEFAULT_TIERS: SeniorityTier[] = [
    { minYears: 0, maxYears: 0.5, days: 7 },
    { minYears: 0.5, maxYears: 5, days: 14 },
    { minYears: 5, maxYears: 10, days: 21 },
    { minYears: 10, maxYears: 20, days: 28 },
    { minYears: 20, maxYears: 99, days: 35 },
  ];
  const list = tiers && tiers.length > 0 ? tiers : DEFAULT_TIERS;
  const sorted = [...list].sort((a, b) => a.minYears - b.minYears);
  for (const tier of sorted) {
    if (years >= tier.minYears && years < tier.maxYears) return tier.days;
  }
  return sorted[sorted.length - 1].days;
}

/**
 * Devuelve el saldo completo de vacaciones de un empleado para un año dado,
 * leyendo del VacationCycle y sumando solicitudes aprobadas/pendientes.
 */
export async function getBalanceForYear(
  employeeId: string,
  year: number = new Date().getFullYear(),
): Promise<VacationBalance> {
  const cycle = await ensureCycle(employeeId, year);

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
    else pending += r.daysRequested;
  }

  const totalAvailable = cycle.annualDays + cycle.carryOver;
  return {
    annual: cycle.annualDays,
    carryOver: cycle.carryOver,
    used,
    pending,
    available: totalAvailable - used - pending,
    cycleOpen: cycle.isOpen,
  };
}

/**
 * Abre los ciclos del año siguiente para todos los empleados activos.
 * Se puede llamar manualmente (endpoint admin) o automáticamente al iniciar el servidor.
 */
export async function openNextYearCycles(): Promise<{ opened: number; skipped: number }> {
  const nextYear = new Date().getFullYear() + 1;
  const employees = await prisma.employee.findMany({ where: { status: 'ACTIVE' } });
  const tiers = await getSeniorityTiers();

  let opened = 0;
  let skipped = 0;

  for (const employee of employees) {
    const existing = await prisma.vacationCycle.findUnique({
      where: { employeeId_year: { employeeId: employee.id, year: nextYear } },
    });

    if (existing?.isOpen) {
      skipped++;
      continue;
    }

    const referenceDate = new Date(Date.UTC(nextYear, 0, 1));
    const annualDays = employee.hireDate
      ? calculateVacationDaysAtDate(employee.hireDate, referenceDate, tiers)
      : employee.annualVacationDays;

    await prisma.vacationCycle.upsert({
      where: { employeeId_year: { employeeId: employee.id, year: nextYear } },
      update: { isOpen: true, annualDays, openedAt: new Date() },
      create: {
        employeeId: employee.id,
        year: nextYear,
        annualDays,
        isOpen: true,
        openedAt: new Date(),
      },
    });
    opened++;
  }

  return { opened, skipped };
}

/**
 * Verifica si es momento de abrir los ciclos del año siguiente
 * según la configuración del sistema, y los abre si corresponde.
 * Se llama al iniciar el servidor.
 */
export async function autoOpenCyclesIfNeeded(): Promise<void> {
  const config = await prisma.systemConfig.findUnique({ where: { id: 'singleton' } });
  if (!config?.allowAdvanceRequest) return;

  const today = new Date();
  const currentYear = today.getFullYear();
  const openMonth = config.nextYearOpenMonth - 1; // 0-indexed
  const openDay = config.nextYearOpenDay;
  const openDate = new Date(Date.UTC(currentYear, openMonth, openDay));

  if (today >= openDate) {
    const result = await openNextYearCycles();
    if (result.opened > 0) {
      console.log(`✅ Ciclo ${currentYear + 1} abierto para ${result.opened} empleados.`);
    }
  }
}
