export type Role = 'ADMIN' | 'EMPLOYEE' | 'MANAGER';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AbsenceType = 'DESCUENTO_DIA' | 'BAJA_ENFERMEDAD' | 'TRAMITE_PERSONAL' | 'GUARDIA' | 'DIA_ESTUDIO' | 'OTHER';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  employeeId: string | null;
  managedDepartmentId: string | null;
  name: string;
  position: string | null;
}

export interface UserWithRole {
  id: string;
  email: string;
  role: Role;
  employeeId: string | null;
  employeeName: string | null;
  employeePosition: string | null;
  managedDepartmentId: string | null;
  managedDepartmentName: string | null;
}

export interface Department {
  id: string;
  name: string;
  color: string;
  _count?: { employees: number };
}

export interface Position {
  id: string;
  name: string;
  _count?: { employees: number };
}

export interface Balance {
  annual: number;
  carryOver: number;
  used: number;
  pending: number;
  available: number;
  cycleOpen: boolean;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  positionId: string;
  position: Position;
  hireDate: string;
  annualVacationDays: number;
  color: string;
  status: EmployeeStatus;
  departmentId: string;
  department: Department;
  balance?: Balance;
  nextYearBalance?: Balance | null;
  hasUser?: boolean;
}

export interface Approval {
  id: string;
  decision: 'APPROVED' | 'REJECTED';
  comment: string | null;
  createdAt: string;
  approver?: { email: string };
}

export interface VacationRequest {
  id: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  chargedToYear?: number | null;
  reason: string | null;
  status: RequestStatus;
  createdAt: string;
  employeeId: string;
  employee: Employee;
  approvals: Approval[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  borderColor?: string;
  extendedProps: {
    type?: 'vacation' | 'holiday' | 'absence';
    department: string;
    departmentColor: string;
    status: RequestStatus;
    reason: string | null;
    days: number;
    employee: string;
    absenceType?: AbsenceType;
    deductsVacation?: boolean;
  };
}

export interface Absence {
  id: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  type: AbsenceType;
  reason: string | null;
  status: RequestStatus;
  createdAt: string;
  employeeId: string;
  employee: Employee;
}

export const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  DESCUENTO_DIA: 'Descuento día',
  BAJA_ENFERMEDAD: 'Baja por enfermedad',
  TRAMITE_PERSONAL: 'Trámites personales',
  GUARDIA: 'Guardia',
  DIA_ESTUDIO: 'Día de estudio',
  OTHER: 'Otro',
};

export const ABSENCE_TYPE_COLORS: Record<AbsenceType, string> = {
  DESCUENTO_DIA: '#f87171',
  BAJA_ENFERMEDAD: '#f59e0b',
  TRAMITE_PERSONAL: '#64748b',
  GUARDIA: '#8b5cf6',
  DIA_ESTUDIO: '#94a3b8',
  OTHER: '#9ca3af',
};

export interface DashboardSummary {
  totalEmployees: number;
  activeEmployees: number;
  pendingRequests: number;
  onVacationCount: number;
  onVacation: { id: string; employee: string; department: string; color: string; endDate: string }[];
  days: Balance;
  nextYearDays?: Balance | null;
}

export interface ReportData {
  byEmployee: {
    name: string;
    department: string;
    position: string;
    annual: number;
    used: number;
    pending: number;
    available: number;
  }[];
  byDepartment: { department: string; employees: number; annual: number; used: number; available: number }[];
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  deductsVacation: boolean;
}

export interface SeniorityTier {
  minYears: number;
  maxYears: number;
  days: number;
}

export interface SystemConfig {
  id: string;
  seniorityTiers: SeniorityTier[];
  minAdvanceNoticeDays: number;
  maxOverlapPercent: number;
  maxOverlapCount: number;
  // Ciclos anuales
  nextYearOpenMonth: number;
  nextYearOpenDay: number;
  allowAdvanceRequest: boolean;
  maxAdvanceDays: number;
  allowCarryOver: boolean;
  maxCarryOverDays: number;
  updatedAt: string;
}

export interface VacationCycle {
  id: string;
  employeeId: string;
  year: number;
  annualDays: number;
  carryOver: number;
  isOpen: boolean;
  openedAt: string | null;
  createdAt: string;
  employee?: Employee;
  balance?: Balance;
}

export interface OverlapData {
  overlaps: VacationRequest[];
  teamSize: number;
}

export interface VacationExclusion {
  id: string;
  employeeAId: string;
  employeeBId: string;
  createdAt: string;
  employeeA: { id: string; firstName: string; lastName: string; position: Position };
  employeeB: { id: string; firstName: string; lastName: string; position: Position };
}

export interface PositionOverlapLimit {
  id: string;
  positionId: string;
  position?: Position;
  maxEmployees: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user?: { email: string } | null;
}
