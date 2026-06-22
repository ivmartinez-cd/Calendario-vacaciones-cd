export type Role = 'ADMIN' | 'EMPLOYEE';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  employeeId: string | null;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  color: string;
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
  position: string;
  hireDate: string;
  annualVacationDays: number;
  color: string;
  status: EmployeeStatus;
  departmentId: string;
  department: Department;
  balance?: Balance;
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
  borderColor: string;
  extendedProps: {
    department: string;
    departmentColor: string;
    status: RequestStatus;
    reason: string | null;
    days: number;
    employee: string;
  };
}

export interface DashboardSummary {
  totalEmployees: number;
  activeEmployees: number;
  pendingRequests: number;
  onVacationCount: number;
  onVacation: { id: string; employee: string; department: string; color: string; endDate: string }[];
  days: Balance;
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

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user?: { email: string } | null;
}
