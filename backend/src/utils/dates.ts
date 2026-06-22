/**
 * Cuenta los días corridos (calendario) entre dos fechas, inclusive.
 * Todos los días dentro del rango cuentan (feriados incluidos).
 * Extiende el fin a través del fin de semana posterior si la fecha de fin
 * cae viernes (+sáb+dom) o sábado (+dom) — días corridos LCT argentina.
 */
export function calendarDaysBetween(start: Date, end: Date): number {
  if (end < start) return 0;

  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  const dow = last.getUTCDay(); // 0=Dom, 5=Vie, 6=Sáb
  if (dow === 5) last.setUTCDate(last.getUTCDate() + 2);
  else if (dow === 6) last.setUTCDate(last.getUTCDate() + 1);

  let count = 0;
  const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  while (cur <= last) {
    count++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return count;
}

export interface SeniorityTier {
  minYears: number;
  maxYears: number;
  days: number;
}

const DEFAULT_TIERS: SeniorityTier[] = [
  { minYears: 0, maxYears: 0.5, days: 7 },
  { minYears: 0.5, maxYears: 5, days: 14 },
  { minYears: 5, maxYears: 10, days: 21 },
  { minYears: 10, maxYears: 20, days: 28 },
  { minYears: 20, maxYears: 99, days: 35 },
];

export function calculateVacationDays(hireDate: Date, tiers?: SeniorityTier[]): number {
  const now = new Date();
  const years = (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  const list = tiers && tiers.length > 0 ? tiers : DEFAULT_TIERS;
  const sorted = [...list].sort((a, b) => a.minYears - b.minYears);

  for (const tier of sorted) {
    if (years >= tier.minYears && years < tier.maxYears) {
      return tier.days;
    }
  }

  return sorted[sorted.length - 1].days;
}

export function addOneDay(d: Date): Date {
  return new Date(d.getTime() + 86_400_000);
}

export function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatDateAR(d: Date): string {
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = String(d.getUTCFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

/** Comprueba si dos rangos de fechas se solapan. */
export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}
