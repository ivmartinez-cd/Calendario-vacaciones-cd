import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { AuditLog } from '@/types';
import { Card, Spinner, Badge, Select, Input } from '@/components/ui';
import { formatDate } from '@/lib/utils';

const actionStyles: Record<string, string> = {
  CREATE: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  UPDATE: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
  APPROVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  REJECT: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
  LOGIN: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300',
  RESET_PASSWORD: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300',
};

const actionLabels: Record<string, string> = {
  CREATE: 'Crear',
  UPDATE: 'Editar',
  DELETE: 'Eliminar',
  APPROVE: 'Aprobar',
  REJECT: 'Rechazar',
  LOGIN: 'Inicio de sesión',
  RESET_PASSWORD: 'Reseteo de contraseña',
};

const entityLabels: Record<string, string> = {
  Employee: 'Empleado',
  VacationRequest: 'Solicitud',
  Department: 'Sector',
  User: 'Usuario',
  Holiday: 'Feriado',
  SystemConfig: 'Configuración',
};

const metaLabels: Record<string, string> = {
  employee: 'Empleado',
  name: 'Nombre',
  email: 'Email',
  startDate: 'Desde',
  endDate: 'Hasta',
  days: 'Días',
  comment: 'Comentario',
  changes: 'Campos modificados',
  date: 'Fecha',
  previousStart: 'Inicio anterior',
  previousEnd: 'Fin anterior',
};

function buildDescription(log: AuditLog): string {
  const action = actionLabels[log.action] ?? log.action;
  const entity = entityLabels[log.entity] ?? log.entity;
  const meta = log.metadata as Record<string, unknown> | null;

  const subject = meta?.employee ?? meta?.name ?? meta?.email ?? '';
  if (!subject) return `${action} — ${entity}`;
  return `${action} — ${entity}: ${subject}`;
}

function formatMetaValue(key: string, value: unknown): string {
  if (value == null) return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return formatDate(value);
  return String(value);
}

export default function Audit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get<AuditLog[]>('/audit', { params: { entity: entity || undefined, action: action || undefined } })
      .then((r) => setLogs(r.data))
      .finally(() => setLoading(false));
  }, [entity, action]);

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter((l) => {
      const desc = buildDescription(l).toLowerCase();
      const user = l.user?.email?.toLowerCase() ?? '';
      return desc.includes(q) || user.includes(q);
    });
  }, [logs, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Auditoría</h1>
        <p className="text-muted-foreground">Registro detallado de cambios y acciones del sistema</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="w-52">
          <Select value={entity} onChange={(e) => setEntity(e.target.value)}>
            <option value="">Todas las entidades</option>
            <option value="Employee">Empleados</option>
            <option value="VacationRequest">Solicitudes</option>
            <option value="Department">Sectores</option>
            <option value="User">Usuarios</option>
            <option value="Holiday">Feriados</option>
            <option value="SystemConfig">Configuración</option>
          </Select>
        </div>
        <div className="w-52">
          <Select value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">Todas las acciones</option>
            <option value="CREATE">Crear</option>
            <option value="UPDATE">Editar</option>
            <option value="DELETE">Eliminar</option>
            <option value="APPROVE">Aprobar</option>
            <option value="REJECT">Rechazar</option>
            <option value="LOGIN">Inicio de sesión</option>
            <option value="RESET_PASSWORD">Reseteo de contraseña</option>
          </Select>
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por descripción o usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">Sin registros de auditoría</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium w-8" />
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Acción</th>
                  <th className="px-4 py-3 font-medium">Entidad</th>
                  <th className="px-4 py-3 font-medium">Descripción</th>
                  <th className="px-4 py-3 font-medium">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const hasMetadata = l.metadata && Object.keys(l.metadata).length > 0;
                  const isExpanded = expandedId === l.id;
                  return (
                    <tr key={l.id} className="group border-b border-border last:border-0">
                      <td colSpan={6} className="p-0">
                        <div
                          className={`flex items-center cursor-pointer hover:bg-muted/50 transition ${isExpanded ? 'bg-muted/30' : ''}`}
                          onClick={() => hasMetadata && setExpandedId(isExpanded ? null : l.id)}
                        >
                          <div className="px-4 py-3 w-8">
                            {hasMetadata && (
                              isExpanded
                                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                            {formatDate(l.createdAt, 'dd/MM/yy HH:mm')}
                          </div>
                          <div className="px-4 py-3">
                            <Badge className={actionStyles[l.action] ?? 'bg-gray-100 text-gray-700'}>
                              {actionLabels[l.action] ?? l.action}
                            </Badge>
                          </div>
                          <div className="px-4 py-3 whitespace-nowrap">
                            {entityLabels[l.entity] ?? l.entity}
                          </div>
                          <div className="px-4 py-3 flex-1 min-w-0 truncate">
                            {buildDescription(l)}
                          </div>
                          <div className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                            {l.user?.email ?? 'Sistema'}
                          </div>
                        </div>
                        {isExpanded && hasMetadata && (
                          <div className="px-12 pb-4">
                            <div className="rounded-lg border border-border bg-muted/30 p-4">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Detalles</p>
                              <dl className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm sm:grid-cols-3">
                                {Object.entries(l.metadata!).map(([key, val]) => {
                                  if (val == null || val === '') return null;
                                  return (
                                    <div key={key}>
                                      <dt className="text-xs text-muted-foreground">{metaLabels[key] ?? key}</dt>
                                      <dd className="font-medium">{formatMetaValue(key, val)}</dd>
                                    </div>
                                  );
                                })}
                              </dl>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-xs text-muted-foreground text-right">
        Mostrando {filtered.length} de {logs.length} registros
      </p>
    </div>
  );
}
