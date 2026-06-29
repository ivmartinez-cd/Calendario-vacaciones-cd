import { useEffect, useMemo, useState } from 'react';
import { Check, X, History, Eye, AlertTriangle, CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { VacationRequest, Balance, OverlapData } from '@/types';
import { Button, Card, Modal, Textarea, Spinner, Select, Badge } from '@/components/ui';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';

export default function Approvals() {
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');
  const [decision, setDecision] = useState<{ req: VacationRequest; type: 'APPROVED' | 'REJECTED' } | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [historyReq, setHistoryReq] = useState<VacationRequest | null>(null);

  type AppSortKey = 'employee' | 'department' | 'startDate' | 'days' | 'status';
  type AppSortDir = 'asc' | 'desc';
  const [sortKey, setSortKey] = useState<AppSortKey>('startDate');
  const [sortDir, setSortDir] = useState<AppSortDir>('desc');

  // Detail modal state
  const [detailReq, setDetailReq] = useState<VacationRequest | null>(null);
  const [detailBalance, setDetailBalance] = useState<Balance | null>(null);
  const [detailOverlaps, setDetailOverlaps] = useState<OverlapData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function load() {
    const params = filter === 'PENDING' ? { status: 'PENDING' } : {};
    const { data } = await api.get<VacationRequest[]>('/vacations', { params });
    setRequests(data);
  }

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const sortedRequests = useMemo(() => {
    const list = [...requests];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'employee': {
          const aName = `${a.employee.firstName} ${a.employee.lastName}`.toLowerCase();
          const bName = `${b.employee.firstName} ${b.employee.lastName}`.toLowerCase();
          cmp = aName.localeCompare(bName); break;
        }
        case 'department': cmp = a.employee.department.name.localeCompare(b.employee.department.name); break;
        case 'startDate': cmp = new Date(a.startDate).getTime() - new Date(b.startDate).getTime(); break;
        case 'days': cmp = a.daysRequested - b.daysRequested; break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [requests, sortKey, sortDir]);

  function toggleSort(key: AppSortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  function SortTh({ k, children }: { k: AppSortKey; children: React.ReactNode }) {
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

  async function openDetail(req: VacationRequest) {
    setDetailReq(req);
    setDetailBalance(null);
    setDetailOverlaps(null);
    setDetailLoading(true);
    try {
      const [balRes, ovRes] = await Promise.all([
        api.get(`/employees/${req.employeeId}`),
        api.get<OverlapData>(`/vacations/${req.id}/overlaps`),
      ]);
      setDetailBalance(balRes.data.balance ?? null);
      setDetailOverlaps(ovRes.data);
    } catch {
      /* ignore */
    } finally {
      setDetailLoading(false);
    }
  }

  async function confirmDecision() {
    if (!decision) return;
    setSaving(true);
    try {
      await api.post(`/vacations/${decision.req.id}/decision`, {
        decision: decision.type,
        comment: comment || undefined,
      });
      toast.success(decision.type === 'APPROVED' ? 'Solicitud aprobada' : 'Solicitud rechazada');
      setDecision(null);
      setComment('');
      setDetailReq(null);
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
          <h1 className="text-2xl font-bold">Aprobación de solicitudes</h1>
          <p className="text-muted-foreground">Revisa, aprueba o rechaza las solicitudes de vacaciones</p>
        </div>
        <div className="w-48">
          <Select value={filter} onChange={(e) => setFilter(e.target.value as 'PENDING' | 'ALL')}>
            <option value="PENDING">Sólo pendientes</option>
            <option value="ALL">Todas</option>
          </Select>
        </div>
      </div>

      <Card>
        {requests.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No hay solicitudes para mostrar</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <SortTh k="employee">Empleado</SortTh>
                  <SortTh k="department">Sector</SortTh>
                  <SortTh k="startDate">Fechas</SortTh>
                  <SortTh k="days">Días</SortTh>
                  <SortTh k="status">Estado</SortTh>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedRequests.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition"
                    onClick={() => openDetail(r)}
                  >
                    <td className="px-4 py-3 font-medium">
                      {r.employee.firstName} {r.employee.lastName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.employee.department.color }} />
                        {r.employee.department.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(r.startDate)} → {formatDate(r.endDate)}
                    </td>
                    <td className="px-4 py-3">{r.daysRequested}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {r.status !== 'APPROVED' && (
                          <Button size="sm" variant="success" onClick={() => setDecision({ req: r, type: 'APPROVED' })}>
                            <Check className="h-4 w-4" /> Aprobar
                          </Button>
                        )}
                        {r.status !== 'REJECTED' && (
                          <Button size="sm" variant="danger" onClick={() => setDecision({ req: r, type: 'REJECTED' })}>
                            <X className="h-4 w-4" /> Rechazar
                          </Button>
                        )}
                        {r.status !== 'PENDING' && (
                          <Button size="sm" variant="outline" onClick={() => setHistoryReq(r)}>
                            <History className="h-4 w-4" /> Historial
                          </Button>
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

      {/* Modal Detalle con Solapamientos */}
      <DetailModal
        request={detailReq}
        balance={detailBalance}
        overlaps={detailOverlaps}
        loading={detailLoading}
        onClose={() => setDetailReq(null)}
        onApprove={(req) => { setDetailReq(null); setDecision({ req, type: 'APPROVED' }); }}
        onReject={(req) => { setDetailReq(null); setDecision({ req, type: 'REJECTED' }); }}
      />

      {/* Modal decisión */}
      <Modal
        open={!!decision}
        onClose={() => setDecision(null)}
        title={decision?.type === 'APPROVED' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
        footer={
          <>
            <Button variant="outline" onClick={() => setDecision(null)}>
              Cancelar
            </Button>
            <Button variant={decision?.type === 'APPROVED' ? 'success' : 'danger'} loading={saving} onClick={confirmDecision}>
              Confirmar
            </Button>
          </>
        }
      >
        {decision && (
          <div className="space-y-4">
            <p className="text-sm">
              {decision.type === 'APPROVED' ? 'Vas a aprobar' : 'Vas a rechazar'} la solicitud de{' '}
              <strong>
                {decision.req.employee.firstName} {decision.req.employee.lastName}
              </strong>{' '}
              ({formatDate(decision.req.startDate)} → {formatDate(decision.req.endDate)}, {decision.req.daysRequested} días).
            </p>
            <Textarea
              label="Comentario (opcional)"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Añade un comentario para el empleado"
            />
          </div>
        )}
      </Modal>

      {/* Modal historial */}
      <Modal open={!!historyReq} onClose={() => setHistoryReq(null)} title="Historial de decisiones">
        {historyReq && historyReq.approvals.length > 0 ? (
          <ul className="space-y-3">
            {historyReq.approvals.map((a) => (
              <li key={a.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <StatusBadge status={a.decision} />
                  <span className="text-xs text-muted-foreground">{formatDate(a.createdAt, 'dd/MM/yy HH:mm')}</span>
                </div>
                <p className="mt-2 text-sm">{a.comment || 'Sin comentario'}</p>
                {a.approver && <p className="mt-1 text-xs text-muted-foreground">Por: {a.approver.email}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Sin historial.</p>
        )}
      </Modal>
    </div>
  );
}

/* ---------- Detail Modal with Overlap Timeline ---------- */

function DetailModal({
  request,
  balance,
  overlaps,
  loading,
  onClose,
  onApprove,
  onReject,
}: {
  request: VacationRequest | null;
  balance: Balance | null;
  overlaps: OverlapData | null;
  loading: boolean;
  onClose: () => void;
  onApprove: (r: VacationRequest) => void;
  onReject: (r: VacationRequest) => void;
}) {
  if (!request) return null;

  const hasOverlaps = overlaps && overlaps.overlaps.length > 0;
  const balanceAfter = balance ? balance.available - request.daysRequested : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Detalle de Solicitud</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <>
              {/* Info del Empleado */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs font-medium text-muted-foreground">Empleado</p>
                  <p className="mt-1 text-base font-semibold">{request.employee.firstName} {request.employee.lastName}</p>
                  <p className="text-sm text-muted-foreground">{request.employee.position?.name}</p>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-sm">
                    <span className="h-2 w-2 rounded-full" style={{ background: request.employee.department.color }} />
                    {request.employee.department.name}
                  </span>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs font-medium text-muted-foreground">Fechas solicitadas</p>
                  <p className="mt-1 text-base font-semibold">
                    {formatDate(request.startDate)} → {formatDate(request.endDate)}
                  </p>
                  <p className="text-sm text-muted-foreground">{request.daysRequested} día(s) a descontar</p>
                  {request.reason && <p className="mt-1 text-sm italic text-muted-foreground">"{request.reason}"</p>}
                </div>
              </div>

              {/* Saldo */}
              {balance && (
                <div className="grid grid-cols-4 gap-3">
                  <MiniCard label="Anuales" value={balance.annual} />
                  <MiniCard label="Usados" value={balance.used} />
                  <MiniCard label="Pendientes" value={balance.pending} />
                  <MiniCard
                    label="Restantes"
                    value={balanceAfter ?? 0}
                    highlight={balanceAfter !== null && balanceAfter >= 0}
                    danger={balanceAfter !== null && balanceAfter < 0}
                  />
                </div>
              )}

              {/* Sección de Solapamientos */}
              <div className={`rounded-lg border-2 p-4 transition ${
                hasOverlaps
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/5'
                  : 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/5'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  {hasOverlaps ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <span className="font-semibold text-amber-800 dark:text-amber-300">
                        Solapamiento detectado ({overlaps!.overlaps.length} persona{overlaps!.overlaps.length > 1 ? 's' : ''})
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                        Sin solapamientos en el equipo
                      </span>
                    </>
                  )}
                </div>

                {hasOverlaps && overlaps && (
                  <OverlapTimeline
                    mainRequest={request}
                    overlapping={overlaps.overlaps}
                    teamSize={overlaps.teamSize}
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          {request.status !== 'REJECTED' && (
            <Button variant="danger" onClick={() => onReject(request)}>
              <X className="h-4 w-4" /> Rechazar
            </Button>
          )}
          {request.status !== 'APPROVED' && (
            <Button variant="success" onClick={() => onApprove(request)}>
              <Check className="h-4 w-4" /> Aprobar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Overlap Timeline (mini-Gantt) ---------- */

function OverlapTimeline({
  mainRequest,
  overlapping,
  teamSize,
}: {
  mainRequest: VacationRequest;
  overlapping: VacationRequest[];
  teamSize: number;
}) {
  const allRequests = [mainRequest, ...overlapping];
  const minDate = Math.min(...allRequests.map((r) => new Date(r.startDate).getTime()));
  const maxDate = Math.max(...allRequests.map((r) => new Date(r.endDate).getTime()));
  const totalDays = Math.ceil((maxDate - minDate) / 86_400_000) + 1;
  const dayWidth = Math.max(100 / totalDays, 2);

  function getBarStyle(start: string, end: string) {
    const s = (new Date(start).getTime() - minDate) / 86_400_000;
    const e = (new Date(end).getTime() - minDate) / 86_400_000;
    return {
      left: `${(s / totalDays) * 100}%`,
      width: `${((e - s + 1) / totalDays) * 100}%`,
    };
  }

  const dateLabels: string[] = [];
  const step = Math.max(1, Math.floor(totalDays / 7));
  for (let i = 0; i < totalDays; i += step) {
    const d = new Date(minDate + i * 86_400_000);
    dateLabels.push(formatDate(d, 'dd/MM'));
  }

  return (
    <div className="space-y-3">
      {/* Timeline */}
      <div className="space-y-2">
        {/* Main request */}
        <div className="flex items-center gap-2">
          <span className="w-28 shrink-0 truncate text-xs font-medium text-foreground">
            {mainRequest.employee.firstName} {mainRequest.employee.lastName}
          </span>
          <div className="relative h-7 flex-1 rounded bg-background">
            <div
              className="absolute top-0.5 h-6 rounded-md bg-primary/80 transition-all"
              style={getBarStyle(mainRequest.startDate, mainRequest.endDate)}
            >
              <span className="flex h-full items-center justify-center text-[10px] font-medium text-primary-foreground px-1 whitespace-nowrap overflow-hidden">
                {mainRequest.daysRequested}d
              </span>
            </div>
          </div>
        </div>

        {/* Overlapping requests */}
        {overlapping.map((r) => {
          const overlapStart = Math.max(new Date(r.startDate).getTime(), new Date(mainRequest.startDate).getTime());
          const overlapEnd = Math.min(new Date(r.endDate).getTime(), new Date(mainRequest.endDate).getTime());
          const overlapDays = Math.ceil((overlapEnd - overlapStart) / 86_400_000) + 1;

          return (
            <div key={r.id} className="flex items-center gap-2">
              <span className="w-28 shrink-0 truncate text-xs font-medium text-amber-700 dark:text-amber-300">
                {r.employee.firstName} {r.employee.lastName}
              </span>
              <div className="relative h-7 flex-1 rounded bg-background">
                {/* Full bar */}
                <div
                  className="absolute top-0.5 h-6 rounded-md bg-amber-200 dark:bg-amber-500/30 transition-all"
                  style={getBarStyle(r.startDate, r.endDate)}
                >
                  <span className="flex h-full items-center justify-center text-[10px] font-medium text-amber-800 dark:text-amber-200 px-1 whitespace-nowrap overflow-hidden">
                    {r.daysRequested}d
                  </span>
                </div>
                {/* Overlap highlight */}
                {overlapDays > 0 && (
                  <div
                    className="absolute top-0.5 h-6 rounded-md border-2 border-red-500/60 bg-red-400/20 transition-all"
                    style={getBarStyle(
                      new Date(overlapStart).toISOString(),
                      new Date(overlapEnd).toISOString(),
                    )}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Date axis */}
      <div className="relative h-5 border-t border-border/50">
        {dateLabels.map((label, i) => (
          <span
            key={i}
            className="absolute -top-0.5 text-[10px] text-muted-foreground"
            style={{ left: `${(i * step / totalDays) * 100}%` }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary/80" /> Solicitud actual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-200 dark:bg-amber-500/30" /> Vacaciones del equipo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border-2 border-red-500/60 bg-red-400/20" /> Días solapados
        </span>
        <span className="ml-auto font-medium">
          Equipo: {overlapping.length + 1}/{teamSize} en vacaciones
        </span>
      </div>
    </div>
  );
}

function MiniCard({ label, value, highlight, danger }: { label: string; value: number; highlight?: boolean; danger?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 text-center transition ${
      danger ? 'border-red-300 bg-red-50 dark:border-red-500/30 dark:bg-red-500/5' :
      highlight ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/5' :
      'border-border'
    }`}>
      <p className={`text-xl font-bold ${danger ? 'text-red-600 dark:text-red-400' : highlight ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
