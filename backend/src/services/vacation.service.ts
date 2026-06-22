/**
 * vacation.service.ts
 * Reexporta getEmployeeBalance apuntando al nuevo sistema de ciclos anuales.
 * Mantiene compatibilidad hacia atrás con todos los controladores existentes.
 */
export { getBalanceForYear as getEmployeeBalance, VacationBalance } from './cycle.service';
