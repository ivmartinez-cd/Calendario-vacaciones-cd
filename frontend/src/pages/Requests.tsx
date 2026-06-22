import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, CalendarRange, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Employee, VacationRequest, Balance, RequestStatus } from '@/types';
import { Button, Card, Input, Modal, Select, Textarea, Spinner, Badge } from '@/components/ui';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, statusLabels, statusStyles } from '@/lib/utils';

function calendarDays(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 0;
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  if (end < start) return 0;
  let days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const dow = end.getDay(); // 0=Dom, 5=Vie, 6=Sáb
  if (dow === 5) days += 2;
  else if (dow === 6) days += 1;
  return days;
}

type SortKey = 'employee' | 'startDate' | 'endDate' | 'days' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

export default function Requests() {
  const { isAdmin, user } = useAuth();
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [editingReq, setEditingReq] = useState<VacationRequest | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ startDate: '', endDate: '', reason: '' });
  const editPreviewDays = useMemo(() => calendarDays(editForm.startDate, editForm.endDate), [editForm.startDate, editForm.endDate]);

  const [form, setForm] = useState({ employeeId: '', startDate: '', endDate: '', reason: '' });
  const previewDays = useMemo(() => calendarDays(form.startDate, form.endDate), [form.startDate, form.endDate]);

  async function load() {
    const reqRes = await api.get<VacationRequest[]>('/vacations');
    setRequests(reqRes.data);

    if (isAdmin) {
      const empRes = await api.get<Employee[]>('/employees');
      setEmployees(empRes.data);
    } else if (user?.employeeId) {
      const me = await api.get<Employee>(`/employees/${user.employeeId}`);
      setBalance(me.data.balance ?? null);
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = [...requests];
    if (statusFilter) list = list.filter((r) => r.status === statusFilter);
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'employee': {
          const aName = `${a.employee.firstName} ${a.employee.lastName}`.toLowerCase();
          const bName = `${b.employee.firstName} ${b.employee.lastName}`.toLowerCase();
          cmp = aName.localeCompare(bName); break;
        }
        case 'startDate': cmp = new Date(a.startDate).getTime() - new Date(b.startDate).getTime(); break;
        case 'endDate': cmp = new Date(a.endDate).getTime() - new Date(b.endDate).getTime(); break;
        case 'days': cmp = a.daysRequested - b.daysRequested; break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'createdAt': cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [requests, statusFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
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
          {active && (sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
        </span>
      </th>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/vacations', {
        employeeId: isAdmin ? form.employeeId || undefined : undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason || undefined,
      });
      toast.success('Solicitud creada');
      setModalOpen(false);
      setForm({ employeeId: '', startDate: '', endDate: '', reason: '' });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function cancel(id: string) {
    if (!confirm('¿Cancelar esta solicitud?')) return;
    try {
      await api.delete(`/vacations/${id}`);
      toast.success('Solicitud cancelada');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function openEdit(r: VacationRequest) {
    setEditingReq(r);
    setEditForm({
      startDate: r.startDate.slice(0, 10),
      endDate: r.endDate.slice(0, 10),
      reason: r.reason || '',
    });
    setEditModalOpen(true);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingReq) return;
    setSaving(true);
    try {
      await api.put(`/vacations/${editingReq.id}`, {
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        reason: editForm.reason || undefined,
      });
      toast.success('Solicitud actualizada');
      setEditModalOpen(false);
      setEditingReq(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isAdmin ? 'Solicitudes de vacaciones' : 'Mis solicitudes'}</h1>
          <p className="text-muted-foreground">Crea y gestiona las solicitudes de vacaciones</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Nueva solicitud
        </Button>
      </div>

      {/* Saldo del empleado */}
      {!isAdmin && balance && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <BalanceCard label="Días anuales" value={balance.annual} />
          <BalanceCard label="Consumidos" value={balance.used} />
          <BalanceCard label="Pendientes" value={balance.pending} />
          <BalanceCard label="Disponibles" value={balance.available} highlight />
        </div>
      )}

      {/* Filtros y Ordenamiento */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filtrar:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === '' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Todas
          </button>
          {(['PENDING', 'APPROVED', 'REJECTED'] as RequestStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === s ? statusStyles[s] : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            <CalendarRange className="mx-auto mb-2 h-10 w-10 opacity-40" />
            {statusFilter ? 'No hay solicitudes con ese estado' : 'No hay solicitudes todavía'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  {isAdmin && <SortTh k="employee">Empleado</SortTh>}
                  <SortTh k="startDate">Inicio</SortTh>
                  <SortTh k="endDate">Fin</SortTh>
                  <SortTh k="days">Días</SortTh>
                  <th className="px-4 py-3 font-medium">Motivo</th>
                  <SortTh k="status">Estado</SortTh>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    {isAdmin && (
                      <td className="px-4 py-3 font-medium">
                        {r.employee.firstName} {r.employee.lastName}
                      </td>
                    )}
                    <td className="px-4 py-3">{formatDate(r.startDate)}</td>
                    <td className="px-4 py-3">{formatDate(r.endDate)}</td>
                    <td className="px-4 py-3">{r.daysRequested}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">{r.reason || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(r.status === 'PENDING' || isAdmin) && (
                          <button onClick={() => openEdit(r)} className="rounded-md p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10" title="Editar">
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {r.status === 'PENDING' && (
                          <button onClick={() => cancel(r.id)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" title="Cancelar">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva solicitud de vacaciones"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button form="request-form" type="submit" loading={saving}>
              Crear solicitud
            </Button>
          </>
        }
      >
        <form id="request-form" onSubmit={submit} className="space-y-4">
          {isAdmin && (
            <Select
              label="Empleado"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              required
            >
              <option value="">Selecciona un empleado</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} — {emp.department.name} ({emp.balance?.available ?? 0} días disp.)
                </option>
              ))}
            </Select>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha de inicio"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
            <Input
              label="Fecha de fin"
              type="date"
              value={form.endDate}
              min={form.startDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />
          </div>
          <Textarea
            label="Motivo (opcional)"
            rows={3}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Ej: Vacaciones de verano"
          />
          {previewDays > 0 && (
            <div className="rounded-lg bg-primary/10 p-3 text-sm">
              Se solicitarán <strong>{previewDays}</strong> día(s) corrido(s).
            </div>
          )}
        </form>
      </Modal>

      {/* Modal editar solicitud */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Editar solicitud"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button form="edit-request-form" type="submit" loading={saving}>
              Guardar cambios
            </Button>
          </>
        }
      >
        <form id="edit-request-form" onSubmit={submitEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha de inicio"
              type="date"
              value={editForm.startDate}
              onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
              required
            />
            <Input
              label="Fecha de fin"
              type="date"
              value={editForm.endDate}
              min={editForm.startDate}
              onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
              required
            />
          </div>
          <Textarea
            label="Motivo (opcional)"
            rows={3}
            value={editForm.reason}
            onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
            placeholder="Ej: Vacaciones de verano"
          />
          {editPreviewDays > 0 && (
            <div className="rounded-lg bg-primary/10 p-3 text-sm">
              Se solicitarán <strong>{editPreviewDays}</strong> día(s) corrido(s).
            </div>
          )}
          {editingReq && editingReq.status !== 'PENDING' && (
            <div className="rounded-lg bg-amber-100 dark:bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
              Al guardar, el estado volverá a <strong>Pendiente</strong> para nueva revisión.
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

function BalanceCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <Card className={`p-4 ${highlight ? 'ring-2 ring-primary/40' : ''}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}
