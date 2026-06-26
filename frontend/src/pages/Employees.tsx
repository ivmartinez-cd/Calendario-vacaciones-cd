import { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, ChevronDown, ChevronUp, Calendar, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';

const EMPLOYEE_COLORS = [
  // Azules
  '#1e3a8a','#1d4ed8','#3b82f6','#60a5fa','#0ea5e9','#0284c7',
  // Índigos / Violetas
  '#4338ca','#6366f1','#7c3aed','#8b5cf6','#9333ea','#a855f7',
  // Verdes
  '#166534','#15803d','#22c55e','#10b981','#059669','#84cc16',
  // Teals / Cyans
  '#0d9488','#14b8a6','#0891b2','#06b6d4','#65a30d','#4d7c0f',
  // Rojos / Rosas
  '#991b1b','#dc2626','#ef4444','#f43f5e','#e11d48','#be123c',
  // Fucsia / Magenta
  '#db2777','#ec4899','#d946ef','#c026d3',
  // Naranjas / Amarillos
  '#92400e','#d97706','#f59e0b','#eab308','#ea580c','#f97316',
  // Neutros
  '#475569','#64748b',
];
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Department, Employee, VacationRequest } from '@/types';
import { Button, Card, Input, Modal, Select, Spinner, Badge } from '@/components/ui';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';

function getSeniority(hireDate: string): { years: number; months: number; label: string } {
  const hire = new Date(hireDate);
  const now = new Date();
  let years = now.getFullYear() - hire.getFullYear();
  let months = now.getMonth() - hire.getMonth();
  if (months < 0) { years--; months += 12; }
  if (now.getDate() < hire.getDate()) {
    months--;
    if (months < 0) { years--; months += 12; }
  }
  const parts: string[] = [];
  if (years > 0) parts.push(`${years}a`);
  if (months > 0 || years === 0) parts.push(`${months}m`);
  return { years, months, label: parts.join(' ') };
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  position: string;
  hireDate: string;
  color: string;
  status: 'ACTIVE' | 'INACTIVE';
  createAccount: boolean;
  changePassword: boolean;
  password: string;
}

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  departmentId: '',
  position: '',
  hireDate: '',
  color: '#3b82f6',
  status: 'ACTIVE',
  createAccount: false,
  changePassword: false,
  password: '',
};

function generateRandomPassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}';
  const all = upper + lower + digits + special;
  const required = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  const rest = Array.from({ length: 8 }, () => all[Math.floor(Math.random() * all.length)]);
  return [...required, ...rest].sort(() => Math.random() - 0.5).join('');
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Mínimo 8 caracteres';
  if (!/[A-Z]/.test(pw)) return 'Debe incluir al menos una mayúscula';
  if (!/[0-9]/.test(pw)) return 'Debe incluir al menos un número';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Debe incluir al menos un carácter especial';
  return null;
}

type SortKey = 'name' | 'department' | 'position' | 'hireDate' | 'seniority' | 'available' | 'status';
type SortDir = 'asc' | 'desc';

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function load() {
    const [emp, dep] = await Promise.all([
      api.get<Employee[]>('/employees', { params: { search: search || undefined, departmentId: deptFilter || undefined } }),
      api.get<Department[]>('/departments'),
    ]);
    setEmployees(emp.data);
    setDepartments(dep.data);
  }

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => load().finally(() => setLoading(false)), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, deptFilter]);

  const uniquePositions = useMemo(
    () => [...new Set(employees.map((e) => e.position).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [employees],
  );

  const sorted = useMemo(() => {
    const list = [...employees];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': {
          const aName = `${a.firstName} ${a.lastName}`.toLowerCase();
          const bName = `${b.firstName} ${b.lastName}`.toLowerCase();
          cmp = aName.localeCompare(bName);
          break;
        }
        case 'department': cmp = a.department.name.localeCompare(b.department.name); break;
        case 'position': cmp = a.position.localeCompare(b.position); break;
        case 'hireDate': cmp = new Date(a.hireDate).getTime() - new Date(b.hireDate).getTime(); break;
        case 'seniority': cmp = new Date(a.hireDate).getTime() - new Date(b.hireDate).getTime(); break;
        case 'available': cmp = (a.balance?.available ?? 0) - (b.balance?.available ?? 0); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [employees, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  function SortTh({ k, children }: { k: SortKey; children: React.ReactNode }) {
    const active = sortKey === k;
    return (
      <th
        className="px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground transition"
        onClick={() => toggleSort(k)}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          {active ? (
            sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 opacity-0 group-hover:opacity-30" />
          )}
        </span>
      </th>
    );
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, departmentId: departments[0]?.id ?? '' });
    setShowPassword(false);
    setModalOpen(true);
  }

  function openEdit(e: Employee) {
    setEditing(e);
    setForm({
      firstName: e.firstName,
      lastName: e.lastName,
      email: e.email,
      departmentId: e.departmentId,
      position: e.position,
      hireDate: e.hireDate.slice(0, 10),
      color: e.color || '#3b82f6',
      status: e.status,
      createAccount: false,
      changePassword: false,
      password: '',
    });
    setShowPassword(false);
    setModalOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const { createAccount, changePassword, password, ...payload } = form;
        const credPayload: Record<string, unknown> = {};

        if (!editing.hasUser && createAccount) {
          if (!password) { toast.error('Ingresá una contraseña'); setSaving(false); return; }
          const err = validatePassword(password);
          if (err) { toast.error(err); setSaving(false); return; }
          credPayload.createAccount = true;
          credPayload.password = password;
        }

        if (editing.hasUser && changePassword) {
          if (!password) { toast.error('Ingresá una nueva contraseña'); setSaving(false); return; }
          const err = validatePassword(password);
          if (err) { toast.error(err); setSaving(false); return; }
          credPayload.changePassword = true;
          credPayload.password = password;
        }

        await api.put(`/employees/${editing.id}`, { ...payload, ...credPayload });
        if (credPayload.createAccount) toast.success('Credenciales creadas correctamente');
        else if (credPayload.changePassword) toast.success('Contraseña actualizada correctamente');
        else toast.success('Empleado actualizado');
      } else {
        const { changePassword, password, ...rest } = form;
        const payload = {
          ...rest,
          ...(rest.createAccount && password ? { password } : {}),
        };
        await api.post('/employees', payload);
        toast.success('Empleado creado');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(emp: Employee) {
    if (!confirm(`¿Eliminar a ${emp.firstName} ${emp.lastName}?`)) return;
    try {
      await api.delete(`/employees/${emp.id}`);
      toast.success('Empleado eliminado');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Empleados</h1>
          <p className="text-muted-foreground">Gestiona la plantilla y sus días de vacaciones</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nuevo empleado
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nombre, email o cargo…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-56">
          <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">Todos los sectores</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner />
          </div>
        ) : sorted.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No se encontraron empleados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="w-8 px-2 py-3" />
                  <SortTh k="name">Empleado</SortTh>
                  <SortTh k="department">Sector</SortTh>
                  <SortTh k="position">Cargo</SortTh>
                  <SortTh k="hireDate">Ingreso</SortTh>
                  <SortTh k="seniority">Antigüedad</SortTh>
                  <SortTh k="available">Disponibles</SortTh>
                  <SortTh k="status">Estado</SortTh>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((e) => (
                  <EmployeeRow
                    key={e.id}
                    employee={e}
                    expanded={expandedId === e.id}
                    onToggle={() => setExpandedId(expandedId === e.id ? null : e.id)}
                    onEdit={() => openEdit(e)}
                    onDelete={() => remove(e)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar empleado' : 'Nuevo empleado'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button form="emp-form" type="submit" loading={saving}>
              {editing ? 'Guardar cambios' : 'Crear empleado'}
            </Button>
          </>
        }
      >
        <form id="emp-form" onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <Input label="Apellido" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Sector" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} required>
              <option value="">Selecciona…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Cargo</label>
              <input
                list="positions-list"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="Seleccioná o escribí un cargo…"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
              <datalist id="positions-list">
                {uniquePositions.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>
          <Input label="Fecha de ingreso" type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} required />
          <div>
            <label className="mb-1.5 block text-sm font-medium">Color en calendario</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {EMPLOYEE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`h-7 w-7 rounded-lg transition ${form.color === c ? 'ring-2 ring-offset-2 ring-primary ring-offset-card' : 'opacity-90 hover:opacity-100'}`}
                  style={{ background: c }}
                  title={c}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-6 w-6 rounded-md border border-border flex-shrink-0" style={{ background: form.color }} />
              <input
                type="text"
                value={form.color}
                onChange={(e) => {
                  const val = e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value;
                  setForm({ ...form, color: val });
                }}
                placeholder="#000000"
                maxLength={7}
                className="w-28 rounded-lg border border-border bg-background px-2 py-1 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span className="text-xs text-muted-foreground">o ingresá un hex personalizado</span>
            </div>
          </div>
          <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </Select>

          {/* Credential management section */}
          {(() => {
            const showPasswordSection =
              (!editing && form.createAccount) ||
              (!!editing && !editing.hasUser && form.createAccount) ||
              (!!editing && !!editing.hasUser && form.changePassword);
            const passwordReqs = [
              { label: 'Mínimo 8 caracteres', met: form.password.length >= 8 },
              { label: 'Al menos una mayúscula', met: /[A-Z]/.test(form.password) },
              { label: 'Al menos un número', met: /[0-9]/.test(form.password) },
              { label: 'Al menos un carácter especial', met: /[^A-Za-z0-9]/.test(form.password) },
            ];

            const passwordField = (placeholder: string) => (
              <div className="mt-3 space-y-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(ev) => setForm({ ...form, password: ev.target.value })}
                      placeholder={placeholder}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm outline-none transition focus:ring-2 focus:ring-primary/40"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 pt-0.5">
                    {passwordReqs.map((req) => (
                      <span
                        key={req.label}
                        className={`flex items-center gap-1 text-xs transition-colors ${req.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
                      >
                        <span className="text-[10px]">{req.met ? '✓' : '○'}</span>
                        {req.label}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const pwd = generateRandomPassword();
                    setForm({ ...form, password: pwd });
                    setShowPassword(true);
                  }}
                >
                  <KeyRound className="h-3.5 w-3.5" /> Generar aleatoria
                </Button>
              </div>
            );

            if (!editing) {
              return (
                <div className="rounded-lg border border-border p-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={form.createAccount}
                      onChange={(ev) => { setForm({ ...form, createAccount: ev.target.checked, password: '' }); setShowPassword(false); }}
                    />
                    Crear cuenta de acceso para este empleado
                  </label>
                  {form.createAccount && passwordField('Por defecto: Empleado123!')}
                </div>
              );
            }

            if (!editing.hasUser) {
              return (
                <div className="rounded-lg border border-border p-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={form.createAccount}
                      onChange={(ev) => { setForm({ ...form, createAccount: ev.target.checked, password: '' }); setShowPassword(false); }}
                    />
                    Generar credenciales de acceso
                  </label>
                  {form.createAccount && passwordField('Contraseña para el empleado')}
                </div>
              );
            }

            return (
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Este empleado ya tiene acceso al sistema
                </div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.changePassword}
                    onChange={(ev) => { setForm({ ...form, changePassword: ev.target.checked, password: '' }); setShowPassword(false); }}
                  />
                  Cambiar contraseña
                </label>
                {form.changePassword && passwordField('Nueva contraseña')}
              </div>
            );
          })()}
        </form>
      </Modal>
    </div>
  );
}

/* ---------- Employee Accordion Row ---------- */

function EmployeeRow({
  employee,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  employee: Employee;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [vacations, setVacations] = useState<VacationRequest[] | null>(null);
  const [loadingVac, setLoadingVac] = useState(false);

  useEffect(() => {
    if (expanded && !vacations) {
      setLoadingVac(true);
      api
        .get<VacationRequest[]>(`/employees/${employee.id}/vacations`)
        .then(({ data }) => setVacations(data))
        .catch(() => setVacations([]))
        .finally(() => setLoadingVac(false));
    }
  }, [expanded, employee.id, vacations]);

  const now = new Date();
  const taken = vacations?.filter(
    (v) => v.status === 'APPROVED' && new Date(v.endDate) < now,
  ) ?? [];
  const upcoming = vacations?.filter(
    (v) => v.status === 'APPROVED' && new Date(v.endDate) >= now,
  ) ?? [];

  const bal = employee.balance;
  const usedAndScheduled = (bal?.used ?? 0) + (bal?.pending ?? 0);
  const total = (bal?.annual ?? 0) + (bal?.carryOver ?? 0);
  const progressPct = total > 0 ? Math.min((usedAndScheduled / total) * 100, 100) : 0;

  return (
    <>
      <tr
        className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition"
        onClick={onToggle}
      >
        <td className="px-2 py-3">
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </td>
        <td className="px-4 py-3">
          <div className="font-medium">
            {employee.firstName} {employee.lastName}
          </div>
          <div className="text-xs text-muted-foreground">{employee.email}</div>
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full border-2"
              style={{ background: employee.color || employee.department.color, borderColor: employee.department.color }}
            />
            {employee.department.name}
          </span>
        </td>
        <td className="px-4 py-3">{employee.position}</td>
        <td className="px-4 py-3">{formatDate(employee.hireDate)}</td>
        <td className="px-4 py-3">
          <span className="font-medium">{getSeniority(employee.hireDate).label}</span>
        </td>
        <td className="px-4 py-3">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground mr-1 uppercase">{new Date().getFullYear()}:</span>
            <span className="font-medium">{bal?.available ?? '—'}</span>
            <span className="text-muted-foreground">/{(bal?.annual ?? 0) + (bal?.carryOver ?? 0)}</span>
          </div>
          {employee.nextYearBalance && (
            <div className="mt-1 text-xs text-violet-600 dark:text-violet-400">
              <span className="text-[10px] font-semibold mr-1 uppercase">{new Date().getFullYear() + 1}:</span>
              <span className="font-medium">{employee.nextYearBalance.available}</span>
              <span className="opacity-80">/{(employee.nextYearBalance.annual ?? 0) + (employee.nextYearBalance.carryOver ?? 0)}</span>
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          <Badge className={employee.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300'}>
            {employee.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={onEdit} className="rounded-md p-1.5 hover:bg-muted">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={onDelete} className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Accordion content */}
      {expanded && (
        <tr>
          <td colSpan={9} className="bg-muted/30 px-4 py-4">
            <div className="animate-in slide-in-from-top-2 duration-200">
              {loadingVac ? (
                <div className="flex h-20 items-center justify-center">
                  <Spinner className="h-5 w-5" />
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-3">
                  {/* Progreso */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <Calendar className="h-4 w-4 text-primary" /> Progreso Anual
                    </h4>
                    
                    {/* Año actual */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>Ciclo {new Date().getFullYear()}</span>
                        <span className="text-muted-foreground">{bal?.available ?? 0} / {total} libres</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progressPct}%`,
                            background: progressPct > 90
                              ? 'hsl(0 72% 51%)'
                              : progressPct > 70
                              ? 'hsl(38 92% 50%)'
                              : 'hsl(var(--primary))',
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Usado: {bal?.used ?? 0}</span>
                        {bal && bal.carryOver > 0 && (
                          <span>Arrastrados: {bal.carryOver}</span>
                        )}
                        <span>Programado: {bal?.pending ?? 0}</span>
                      </div>
                    </div>

                    {/* Año siguiente (si está abierto) */}
                    {employee.nextYearBalance && (
                      <div className="mt-4 border-t border-border pt-4 space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-violet-700 dark:text-violet-300">
                          <span>Ciclo del año siguiente ({new Date().getFullYear() + 1}) (Anticipado)</span>
                          <span>{employee.nextYearBalance.available} / {employee.nextYearBalance.annual + employee.nextYearBalance.carryOver} libres</span>
                        </div>
                        {(() => {
                          const nextBal = employee.nextYearBalance;
                          const nextTotal = nextBal.annual + nextBal.carryOver;
                          const nextUsedAndScheduled = nextBal.used + nextBal.pending;
                          const nextProgressPct = nextTotal > 0 ? Math.min((nextUsedAndScheduled / nextTotal) * 100, 100) : 0;
                          return (
                            <>
                              <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-violet-600 dark:bg-violet-500 transition-all duration-500"
                                  style={{ width: `${nextProgressPct}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>Usado: {nextBal.used}</span>
                                {nextBal.carryOver > 0 && (
                                  <span>Arrastrados: {nextBal.carryOver}</span>
                                )}
                                <span>Programado: {nextBal.pending}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Historial */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h4 className="mb-3 text-sm font-semibold">Historial (tomados)</h4>
                    {taken.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sin vacaciones tomadas este año</p>
                    ) : (
                      <ul className="space-y-2 max-h-32 overflow-y-auto">
                        {taken.map((v) => (
                          <li key={v.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5 text-xs">
                            <span>{formatDate(v.startDate)} → {formatDate(v.endDate)}</span>
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                              {v.daysRequested}d
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Próximos */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h4 className="mb-3 text-sm font-semibold">Próximos (aprobados)</h4>
                    {upcoming.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sin vacaciones programadas</p>
                    ) : (
                      <ul className="space-y-2 max-h-32 overflow-y-auto">
                        {upcoming.map((v) => (
                          <li key={v.id} className="flex items-center justify-between rounded-md bg-primary/5 px-3 py-1.5 text-xs">
                            <span>{formatDate(v.startDate)} → {formatDate(v.endDate)}</span>
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                              {v.daysRequested}d
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
