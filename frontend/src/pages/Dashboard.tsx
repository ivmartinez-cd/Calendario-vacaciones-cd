import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import multiMonthPlugin from '@fullcalendar/multimonth';
import { Users, UserCheck, Clock, CalendarOff, Plane, CalendarCheck2 } from 'lucide-react';
import { api } from '@/lib/api';
import { CalendarEvent, DashboardSummary } from '@/types';
import { Card, Spinner } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/dashboard/summary'), api.get('/vacations/calendar')])
      .then(([s, e]) => {
        setSummary(s.data);
        setEvents(e.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general de vacaciones del equipo</p>
      </div>

      {/* Métricas */}
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${summary?.nextYearDays ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
        <Stat icon={Users} label="Total empleados" value={summary?.totalEmployees ?? 0} hint={`${summary?.activeEmployees ?? 0} activos`} color="text-blue-600 bg-blue-100 dark:bg-blue-500/15" />
        <Stat icon={Plane} label="De vacaciones hoy" value={summary?.onVacationCount ?? 0} color="text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15" />
        <Stat icon={Clock} label="Solicitudes pendientes" value={summary?.pendingRequests ?? 0} color="text-amber-600 bg-amber-100 dark:bg-amber-500/15" />
        <Stat
          icon={CalendarCheck2}
          label={summary?.nextYearDays ? `Disponibles ${new Date().getFullYear()}` : 'Días disponibles'}
          value={summary?.days.available ?? 0}
          hint={summary?.days.carryOver && summary.days.carryOver > 0 ? `de ${summary.days.annual} (+${summary.days.carryOver} arrastrados)` : `de ${summary?.days.annual ?? 0} totales`}
          color="text-violet-600 bg-violet-100 dark:bg-violet-500/15"
        />
        {summary?.nextYearDays && (
          <Stat
            icon={CalendarCheck2}
            label={`Disponibles año siguiente (${new Date().getFullYear() + 1})`}
            value={summary.nextYearDays.available}
            hint={`de ${summary.nextYearDays.annual} totales (anticipadas)`}
            color="text-fuchsia-600 bg-fuchsia-100 dark:bg-fuchsia-500/15"
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Calendario */}
        <Card className="p-4 xl:col-span-2">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, multiMonthPlugin]}
            initialView="dayGridMonth"
            locale="es"
            firstDay={1}
            height="auto"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,multiMonthYear',
            }}
            buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', year: 'Año' }}
            events={events}
            eventDisplay="block"
            dayMaxEvents={3}
          />
        </Card>

        {/* De vacaciones actualmente */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarOff className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">De vacaciones ahora</h2>
          </div>
          {summary && summary.onVacation.length > 0 ? (
            <ul className="space-y-3">
              {summary.onVacation.map((v) => (
                <li key={v.id} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: v.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{v.employee}</p>
                    <p className="text-xs text-muted-foreground">{v.department}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">hasta {formatDate(v.endDate)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              <UserCheck className="mx-auto mb-2 h-8 w-8 opacity-40" />
              Nadie está de vacaciones hoy
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  hint?: string;
  color: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold leading-tight">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  );
}
