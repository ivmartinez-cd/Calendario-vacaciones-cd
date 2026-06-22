import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Settings2, Clock, Users, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { SystemConfig, SeniorityTier } from '@/types';
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
  const [activeTab, setActiveTab] = useState<'tiers' | 'rules' | 'cycles'>('tiers');
  // Ciclos anuales
  const [nextYearOpenMonth, setNextYearOpenMonth] = useState(10);
  const [nextYearOpenDay, setNextYearOpenDay] = useState(1);
  const [allowAdvanceRequest, setAllowAdvanceRequest] = useState(true);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(0);
  const [openingCycle, setOpeningCycle] = useState(false);

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
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

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
  ];

  async function forceOpenNextYear() {
    if (!confirm(`¿Abrir el ciclo ${new Date().getFullYear() + 1} para todos los empleados activos?`)) return;
    setOpeningCycle(true);
    try {
      const { data } = await api.post<{ opened: number; skipped: number }>('/cycles/open-next-year');
      toast.success(`Ciclo ${new Date().getFullYear() + 1} abierto: ${data.opened} empleados nuevos, ${data.skipped} ya abiertos`);
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
                  Fecha a partir de la cual se habilitan solicitudes del {new Date().getFullYear() + 1}
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
              El ciclo {new Date().getFullYear() + 1} se abrirá automáticamente el
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

          <Card className="p-6 lg:col-span-2">
            <h2 className="mb-2 font-semibold">Acción Manual</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Fuerza la apertura inmediata del ciclo {new Date().getFullYear() + 1} sin esperar la fecha de apertura automática.
            </p>
            <Button variant="outline" onClick={forceOpenNextYear} loading={openingCycle}>
              <CalendarClock className="h-4 w-4" />
              Abrir ciclo {new Date().getFullYear() + 1} ahora
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
