import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import multiMonthPlugin from '@fullcalendar/multimonth';
import { EventClickArg, EventHoveringArg } from '@fullcalendar/core';
import { api } from '@/lib/api';
import { CalendarEvent, Department } from '@/types';
import { Card, Spinner, Modal, Select } from '@/components/ui';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';

export default function TeamCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptFilter, setDeptFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CalendarEvent['extendedProps'] | null>(null);

  useEffect(() => {
    Promise.all([api.get('/vacations/calendar'), api.get('/departments')])
      .then(([e, d]) => {
        setEvents(e.data);
        setDepartments(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = deptFilter
    ? events.filter((e) => e.extendedProps.department === deptFilter)
    : events;

  function handleClick(arg: EventClickArg) {
    const p = arg.event.extendedProps;
    if (p.type === 'holiday') return;
    setSelected(p as CalendarEvent['extendedProps']);
  }

  function handleMouseEnter(arg: EventHoveringArg) {
    const p = arg.event.extendedProps;
    if (p.type === 'holiday') {
      arg.el.setAttribute('title', `Feriado: ${arg.event.title}${p.deductsVacation ? ' (descuenta vacaciones)' : ''}`);
      return;
    }
    arg.el.setAttribute(
      'title',
      `${p.employee}\nSector: ${p.department}\n${p.days} día(s)\n${p.status}`,
    );
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
          <h1 className="text-2xl font-bold">Calendario de equipo</h1>
          <p className="text-muted-foreground">Vacaciones de todos los empleados por sector</p>
        </div>
        <div className="w-56">
          <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">Todos los sectores</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Leyenda */}
      <Card className="flex flex-wrap gap-4 p-4">
        {departments.map((d) => (
          <div key={d.id} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
            {d.name}
          </div>
        ))}
      </Card>

      <Card className="p-4">
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
          events={filtered}
          eventClick={handleClick}
          eventMouseEnter={handleMouseEnter}
          eventDisplay="block"
          dayMaxEvents={4}
        />
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle de vacaciones">
        {selected && (
          <div className="space-y-3 text-sm">
            <Row label="Empleado" value={selected.employee} />
            <Row label="Sector" value={selected.department} />
            <Row label="Días" value={`${selected.days}`} />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado</span>
              <StatusBadge status={selected.status} />
            </div>
            {selected.reason && <Row label="Motivo" value={selected.reason} />}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
