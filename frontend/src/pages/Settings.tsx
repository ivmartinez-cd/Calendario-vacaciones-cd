import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Settings2, Clock, Users, CalendarClock, ShieldCheck, Scale } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { SystemConfig, SeniorityTier, UserWithRole, Department, Employee, VacationExclusion, PositionOverlapLimit } from '@/types';
import { Button, Card, Input, Spinner } from '@/components/ui';

const defaultTier: SeniorityTier = { minYears: 0, maxYears: 1, days: 14 };

export default function Settings() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tiers, setTiers] = useState<SeniorityTier[]>([]);
  const [advanceDays, setAdvanceDays] = useState(7);
  const [overlapPercent, setOverlapPercent] = useState(50);
  const [overlapCount, setOverlapCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'tiers' | 'rules' | 'cycles' | 'users' | 'overlaps'>('tiers');
  // Ciclos anuales
  const [nextYearOpenMonth, setNextYearOpenMonth] = useState(10);
  const [nextYearOpenDay, setNextYearOpenDay] = useState(1);
  const [allowAdvanceRequest, setAllowAdvanceRequest] = useState(true);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(0);
  const [allowCarryOver, setAllowCarryOver] = useState(true);
  const [maxCarryOverDays, setMaxCarryOverDays] = useState(0);
  const [openingCycle, setOpeningCycle] = useState(false);
  // Usuarios y Roles
  const [usersData, setUsersData] = useState<UserWithRole[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [savingUser, setSavingUser] = useState<string | null>(null);
  // Solapamientos
  const [exclusions, setExclusions] = useState<VacationExclusion[]>([]);
  const [positionLimits, setPositionLimits] = useState<PositionOverlapLimit[]>([]);
  const [overlapEmployees, setOverlapEmployees] = useState<Employee[]>([]);
  const [loadingOverlaps, setLoadingOverlaps] = useState(false);
  const [exclusionForm, setExclusionForm] = useState({ employeeAId: '', employeeBId: '' });
  const [posLimitForm, setPosLimitForm] = useState({ position: '', maxEmployees: 1 });
  const [savingExclusion, setSavingExclusion] = useState(false);
  const [savingPosLimit, setSavingPosLimit] = useState(false);

  async function load() {
    const { data: cfg } = await api.get<SystemConfig>('/settings');
    setConfig(cfg);
    setTiers(cfg.seniorityTiers);
    setAdvanceDays(cfg.minAdvanceNoticeDays);
    setOverlapPercent(cfg.maxOverlapPercent);
    setOverlapCount(cfg.maxOverlapCount);
    setNextYearOpenMonth(cfg.nextYearOpenMonth ?? 10);
    setNextYearOpenDay(cfg.nextYearOpenDay ?? 1);
    setAllowAdvanceRequest(cfg.allowAdvanceRequest ?? true);
    setMaxAdvanceDays(cfg.maxAdvanceDays ?? 0);
    setAllowCarryOver(cfg.allowCarryOver ?? true);
    setMaxCarryOverDays(cfg.maxCarryOverDays ?? 0);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function loadUsersTab() {
    const [{ data: u }, { data: d }] = await Promise.all([
      api.get<UserWithRole[]>('/users'),
      api.get<Department[]>('/departments'),
    ]);
    setUsersData(u);
    setDepartments(d);
  }

  useEffect(() => {
    if (activeTab === 'users') loadUsersTab();
  }, [activeTab]);

  async function loadOverlapsTab() {
    setLoadingOverlaps(true);
    try {
      const [{ data: excl }, { data: limits }, { data: emps }] = await Promise.all([
        api.get<VacationExclusion[]>('/settings/exclusions'),
        api.get<PositionOverlapLimit[]>('/settings/position-limits'),
        api.get<Employee[]>('/employees?status=ACTIVE'),
      ]);
      setExclusions(excl);
      setPositionLimits(limits);
      setOverlapEmployees(emps.filter((e) => e.status === 'ACTIVE'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingOverlaps(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'overlaps') loadOverlapsTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function addExclusion(e: React.FormEvent) {
    e.preventDefault();
    setSavingExclusion(true);
    try {
      const { data } = await api.post<VacationExclusion>('/settings/exclusions', exclusionForm);
      setExclusions((prev) => [data, ...prev]);
      setExclusionForm({ employeeAId: '', employeeBId: '' });
      toast.success('Exclusión agregada');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingExclusion(false);
    }
  }

  async function removeExclusion(id: string) {
    if (!confirm('¿Eliminar esta exclusión?')) return;
    try {
      await api.delete(`/settings/exclusions/${id}`);
      setExclusions((prev) => prev.filter((e) => e.id !== id));
      toast.success('Exclusión eliminada');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function addPositionLimit(e: React.FormEvent) {
    e.preventDefault();
    setSavingPosLimit(true);
    try {
      const { data } = await api.post<PositionOverlapLimit>('/settings/position-limits', {
        position: posLimitForm.position,
        maxEmployees: posLimitForm.maxEmployees,
      });
      setPositionLimits((prev) => {
        const exists = prev.findIndex((p) => p.id === data.id);
        if (exists >= 0) return prev.map((p) => (p.id === data.id ? data : p));
        return [...prev, data].sort((a, b) => a.position.localeCompare(b.position));
      });
      setPosLimitForm({ position: '', maxEmployees: 1 });
      toast.success('Regla guardada');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPosLimit(false);
    }
  }

  async function removePositionLimit(id: string) {
    if (!confirm('¿Eliminar esta regla?')) return;
    try {
      await api.delete(`/settings/position-limits/${id}`);
      setPositionLimits((prev) => prev.filter((p) => p.id !== id));
      toast.success('Regla eliminada');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function updateUserRole(userId: string, role: string, managedDepartmentId: string | null) {
    setSavingUser(userId);
    try {
      const { data } = await api.put<UserWithRole>(`/users/${userId}/role`, { role, managedDepartmentId });
      setUsersData((prev) =>
        prev.map((u) =>
          u.id === data.id
            ? { ...u, role: data.role, managedDepartmentId: data.managedDepartmentId, managedDepartmentName: data.managedDepartmentName }
            : u,
        ),
      );
      toast.success('Rol actualizado');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingUser(null);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const { data } = await api.put<SystemConfig>('/settings', {
        seniorityTiers: tiers,
        minAdvanceNoticeDays: advanceDays,
        maxOverlapPercent: overlapPercent,
        maxOverlapCount: overlapCount,
        nextYearOpenMonth,
        nextYearOpenDay,
        allowAdvanceRequest,
        maxAdvanceDays,
        allowCarryOver,
        maxCarryOverDays,
      });
      setConfig(data);
      toast.success('Configuración guardada');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function updateTier(index: number, field: keyof SeniorityTier, value: number) {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }

  function addTier() {
    const last = tiers[tiers.length - 1];
    setTiers([...tiers, { minYears: last?.maxYears ?? 0, maxYears: (last?.maxYears ?? 0) + 5, days: (last?.days ?? 14) + 7 }]);
  }

  function removeTier(index: number) {
    if (tiers.length <= 1) return;
    setTiers((prev) => prev.filter((_, i) => i !== index));
  }

  if (loading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );

  const tabs = [
    { id: 'tiers' as const, label: 'Antigüedad y Días', icon: Settings2 },
    { id: 'rules' as const, label: 'Reglas de Solicitud', icon: Clock },
    { id: 'cycles' as const, label: 'Ciclos Anuales', icon: CalendarClock },
    { id: 'users' as const, label: 'Usuarios y Roles', icon: ShieldCheck },
    { id: 'overlaps' as const, label: 'Solapamientos', icon: Scale },
  ];

  const uniquePositions = [...new Set(overlapEmployees.map((e) => e.position))].sort();

  async function forceOpenNextYear() {
    const nextYearYear = new Date().getFullYear() + 1;
    if (!confirm(`¿Abrir el ciclo del año siguiente (${nextYearYear}) para todos los empleados activos?`)) return;
    setOpeningCycle(true);
    try {
      const { data } = await api.post<{ opened: number; skipped: number }>('/cycles/open-next-year');
      toast.success(`Ciclo ${nextYearYear} abierto: ${data.opened} empleados nuevos, ${data.skipped} ya abiertos`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setOpeningCycle(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Configuración del Sistema</h1>
          <p className="text-muted-foreground">Ajusta los parámetros clave de la gestión de vacaciones</p>
        </div>
        <Button onClick={save} loading={saving}>
          <Save className="h-4 w-4" /> Guardar cambios
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Antigüedad */}
      {activeTab === 'tiers' && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Tabla de Antigüedad vs. Días</h2>
              <p className="text-sm text-muted-foreground">
                Define cuántos días de vacaciones corresponden según la antigüedad del empleado
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={addTier}>
              <Plus className="h-4 w-4" /> Agregar rango
            </Button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_1fr_1fr_40px] gap-3 text-xs font-medium text-muted-foreground">
              <span>Desde (años)</span>
              <span>Hasta (años)</span>
              <span>Días de vacaciones</span>
              <span />
            </div>
            {tiers.map((tier, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_1fr_1fr_40px] items-center gap-3 rounded-lg border border-border bg-background p-3 transition hover:border-primary/30"
              >
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={tier.minYears}
                  onChange={(e) => updateTier(i, 'minYears', parseFloat(e.target.value) || 0)}
                />
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={tier.maxYears}
                  onChange={(e) => updateTier(i, 'maxYears', parseFloat(e.target.value) || 0)}
                />
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={tier.days}
                  onChange={(e) => updateTier(i, 'days', parseInt(e.target.value) || 1)}
                />
                <button
                  onClick={() => removeTier(i)}
                  disabled={tiers.length <= 1}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-red-500 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium text-primary">Vista previa</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tiers.map((tier, i) => (
                <span
                  key={i}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {tier.minYears}–{tier.maxYears} años → {tier.days} días
                </span>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Tab: Reglas */}
      {activeTab === 'rules' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">Aviso Previo Mínimo</h2>
                <p className="text-sm text-muted-foreground">
                  Días de anticipación para enviar una solicitud
                </p>
              </div>
            </div>
            <Input
              type="number"
              min={0}
              max={365}
              value={advanceDays}
              onChange={(e) => setAdvanceDays(parseInt(e.target.value) || 0)}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Los empleados deberán solicitar con al menos <strong>{advanceDays}</strong> día(s) de anticipación.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">Límite de Solapamiento</h2>
                <p className="text-sm text-muted-foreground">
                  Máximo de personas del mismo equipo en vacaciones simultáneas
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Porcentaje máximo del equipo</label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={overlapPercent}
                    onChange={(e) => setOverlapPercent(parseInt(e.target.value))}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                  />
                  <span className="w-12 text-right text-sm font-semibold">{overlapPercent}%</span>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <label className="text-sm font-medium">O cantidad fija máxima (0 = usar porcentaje)</label>
                <div className="mt-1.5">
                  <Input
                    type="number"
                    min={0}
                    value={overlapCount}
                    onChange={(e) => setOverlapCount(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Ciclos Anuales */}
      {activeTab === 'cycles' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">Apertura del Año Siguiente</h2>
                <p className="text-sm text-muted-foreground">
                  Fecha a partir de la cual se habilitan solicitudes del año próximo
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Mes de apertura</label>
                <select
                  value={nextYearOpenMonth}
                  onChange={(e) => setNextYearOpenMonth(parseInt(e.target.value))}
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {[
                    [1,'Enero'],[2,'Febrero'],[3,'Marzo'],[4,'Abril'],[5,'Mayo'],[6,'Junio'],
                    [7,'Julio'],[8,'Agosto'],[9,'Septiembre'],[10,'Octubre'],[11,'Noviembre'],[12,'Diciembre'],
                  ].map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Día"
                type="number"
                min={1}
                max={31}
                value={nextYearOpenDay}
                onChange={(e) => setNextYearOpenDay(parseInt(e.target.value) || 1)}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              El ciclo del año siguiente ({new Date().getFullYear() + 1}) se abrirá automáticamente el
              {' '}<strong>{String(nextYearOpenDay).padStart(2,'0')}/{String(nextYearOpenMonth).padStart(2,'0')}/{new Date().getFullYear()}</strong>.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">Solicitudes Adelantadas</h2>
                <p className="text-sm text-muted-foreground">Permisos y límites para pedir vacaciones del año siguiente</p>
              </div>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowAdvanceRequest}
                  onChange={(e) => setAllowAdvanceRequest(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-sm font-medium">Permitir solicitudes del año siguiente</span>
              </label>
              {allowAdvanceRequest && (
                <div>
                  <Input
                    label={`Límite de días adelantados (0 = sin límite)`}
                    type="number"
                    min={0}
                    value={maxAdvanceDays}
                    onChange={(e) => setMaxAdvanceDays(parseInt(e.target.value) || 0)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {maxAdvanceDays === 0
                      ? 'Los empleados pueden pedir hasta el total de su saldo del año siguiente.'
                      : `Los empleados pueden pedir hasta ${maxAdvanceDays} días por anticipado del año siguiente.`}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">Arrastre de Vacaciones (Carry-Over)</h2>
                <p className="text-sm text-muted-foreground">Configuración para transferir días no usados al año siguiente</p>
              </div>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowCarryOver}
                  onChange={(e) => setAllowCarryOver(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-sm font-medium">Permitir arrastrar días no usados</span>
              </label>
              {allowCarryOver && (
                <div>
                  <Input
                    label={`Límite de días a arrastrar (0 = sin límite)`}
                    type="number"
                    min={0}
                    value={maxCarryOverDays}
                    onChange={(e) => setMaxCarryOverDays(parseInt(e.target.value) || 0)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {maxCarryOverDays === 0
                      ? 'Los días sobrantes se arrastrarán completos al ciclo del año siguiente.'
                      : `Se arrastrará un máximo de ${maxCarryOverDays} días sobrantes al ciclo del año siguiente.`}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <h2 className="mb-2 font-semibold">Acción Manual</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Fuerza la apertura inmediata del ciclo del año siguiente ({new Date().getFullYear() + 1}) sin esperar la fecha de apertura automática.
            </p>
            <Button variant="outline" onClick={forceOpenNextYear} loading={openingCycle}>
              <CalendarClock className="h-4 w-4" />
              Abrir ciclo {new Date().getFullYear() + 1} ahora
            </Button>
          </Card>
        </div>
      )}

      {/* Tab: Solapamientos */}
      {activeTab === 'overlaps' && (
        loadingOverlaps ? (
          <div className="flex h-64 items-center justify-center"><Spinner className="h-8 w-8" /></div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Exclusiones mutuas */}
            <Card className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">Exclusiones Mutuas</h2>
                  <p className="text-sm text-muted-foreground">Pares de empleados que no pueden solapar vacaciones</p>
                </div>
              </div>

              <form onSubmit={addExclusion} className="mb-5 space-y-3">
                <div>
                  <label className="text-sm font-medium">Empleado A</label>
                  <select
                    value={exclusionForm.employeeAId}
                    onChange={(e) => setExclusionForm({ ...exclusionForm, employeeAId: e.target.value })}
                    required
                    className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Seleccionar empleado...</option>
                    {overlapEmployees
                      .filter((e) => e.id !== exclusionForm.employeeBId)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.firstName} {e.lastName} — {e.position}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Empleado B</label>
                  <select
                    value={exclusionForm.employeeBId}
                    onChange={(e) => setExclusionForm({ ...exclusionForm, employeeBId: e.target.value })}
                    required
                    className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Seleccionar empleado...</option>
                    {overlapEmployees
                      .filter((e) => e.id !== exclusionForm.employeeAId)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.firstName} {e.lastName} — {e.position}
                        </option>
                      ))}
                  </select>
                </div>
                <Button type="submit" loading={savingExclusion} size="sm">
                  <Plus className="h-4 w-4" /> Agregar exclusión
                </Button>
              </form>

              {exclusions.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No hay exclusiones configuradas</p>
              ) : (
                <div className="space-y-2">
                  {exclusions.map((exc) => (
                    <div key={exc.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                      <p className="text-sm">
                        <span className="font-medium">{exc.employeeA.firstName} {exc.employeeA.lastName}</span>
                        <span className="mx-2 text-muted-foreground">vs</span>
                        <span className="font-medium">{exc.employeeB.firstName} {exc.employeeB.lastName}</span>
                      </p>
                      <button
                        onClick={() => removeExclusion(exc.id)}
                        className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Límites por cargo */}
            <Card className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">Límites por Cargo</h2>
                  <p className="text-sm text-muted-foreground">Máximo de personas del mismo cargo en vacaciones simultáneas</p>
                </div>
              </div>

              <form onSubmit={addPositionLimit} className="mb-5 space-y-3">
                <div>
                  <label className="text-sm font-medium">Cargo / Posición</label>
                  <input
                    list="positions-datalist"
                    value={posLimitForm.position}
                    onChange={(e) => setPosLimitForm({ ...posLimitForm, position: e.target.value })}
                    required
                    placeholder="Ej: Operador Mesa de Ayuda"
                    className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <datalist id="positions-datalist">
                    {uniquePositions.map((p) => <option key={p} value={p} />)}
                  </datalist>
                </div>
                <Input
                  label="Límite máximo simultáneo"
                  type="number"
                  min={1}
                  value={posLimitForm.maxEmployees}
                  onChange={(e) => setPosLimitForm({ ...posLimitForm, maxEmployees: parseInt(e.target.value) || 1 })}
                  required
                />
                <Button type="submit" loading={savingPosLimit} size="sm">
                  <Plus className="h-4 w-4" /> Agregar regla
                </Button>
              </form>

              {positionLimits.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No hay límites configurados</p>
              ) : (
                <div className="space-y-2">
                  {positionLimits.map((pl) => (
                    <div key={pl.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                      <div className="text-sm">
                        <span className="font-medium">{pl.position}</span>
                        <span className="ml-2 text-muted-foreground">— Máximo {pl.maxEmployees} a la vez</span>
                      </div>
                      <button
                        onClick={() => removePositionLimit(pl.id)}
                        className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )
      )}

      {/* Tab: Usuarios y Roles */}
      {activeTab === 'users' && (
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Usuarios y Roles</h2>
            <p className="text-sm text-muted-foreground">
              Asigná rol y sector a cada usuario. Los <strong>Jefes de sector</strong> solo pueden ver y aprobar solicitudes de su sector asignado.
            </p>
          </div>

          {usersData.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                    <th className="pb-3 pr-4">Usuario</th>
                    <th className="pb-3 pr-4">Rol</th>
                    <th className="pb-3 pr-4">Sector a cargo</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usersData.map((u) => (
                    <UserRoleRow
                      key={u.id}
                      user={u}
                      departments={departments}
                      saving={savingUser === u.id}
                      onSave={(role, deptId) => updateUserRole(u.id, role, deptId)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Referencia de roles</p>
            <ul className="mt-2 space-y-1 text-xs text-blue-600 dark:text-blue-300">
              <li><strong>Administrador:</strong> acceso completo a todos los sectores, empleados y configuración.</li>
              <li><strong>Jefe de sector:</strong> solo ve y aprueba solicitudes del sector asignado. No puede aprobar la propia.</li>
              <li><strong>Empleado:</strong> solo gestiona sus propias solicitudes de vacaciones. El cargo que se muestra es el asignado en su perfil.</li>
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}

interface UserRoleRowProps {
  user: UserWithRole;
  departments: Department[];
  saving: boolean;
  onSave: (role: string, managedDepartmentId: string | null) => void;
}

function UserRoleRow({ user, departments, saving, onSave }: UserRoleRowProps) {
  const [role, setRole] = useState(user.role);
  const [deptId, setDeptId] = useState<string>(user.managedDepartmentId ?? '');
  const dirty = role !== user.role || (role === 'MANAGER' && deptId !== (user.managedDepartmentId ?? ''));

  function handleSave() {
    onSave(role, role === 'MANAGER' ? (deptId || null) : null);
  }

  const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Jefe de sector',
    EMPLOYEE: 'Empleado',
  };

  return (
    <tr className="group">
      <td className="py-3 pr-4">
        <p className="font-medium">{user.employeeName ?? '—'}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
        {user.employeePosition && <p className="text-xs text-muted-foreground">{user.employeePosition}</p>}
      </td>
      <td className="py-3 pr-4">
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value as typeof role);
            if (e.target.value !== 'MANAGER') setDeptId('');
          }}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {(['ADMIN', 'MANAGER', 'EMPLOYEE'] as const).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </td>
      <td className="py-3 pr-4">
        {role === 'MANAGER' ? (
          <select
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">— seleccionar sector —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3">
        {dirty && (
          <Button size="sm" onClick={handleSave} loading={saving} disabled={role === 'MANAGER' && !deptId}>
            <Save className="h-3.5 w-3.5" />
            Guardar
          </Button>
        )}
      </td>
    </tr>
  );
}
