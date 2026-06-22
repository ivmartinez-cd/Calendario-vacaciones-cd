import { clsx, type ClassValue } from 'clsx';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date, pattern = 'dd/MM/yy'): string {
  let d: Date;
  if (typeof date === 'string') {
    if (date.includes('T00:00:00')) {
      const [y, m, day] = date.slice(0, 10).split('-').map(Number);
      d = new Date(y, m - 1, day);
    } else {
      d = parseISO(date);
    }
  } else {
    d = date;
  }
  return format(d, pattern, { locale: es });
}

export const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

export const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
};
