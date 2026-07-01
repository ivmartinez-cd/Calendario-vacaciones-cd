import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Calendar, UserCheck, HeartPulse, Plane, FileText, AlertCircle, ShieldAlert, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Absence, AbsenceType, Employee, ABSENCE_TYPE_LABELS, ABSENCE_TYPE_COLORS, RequestStatus, Holiday, VacationRequest } from '@/types';
import { Button, Card, Input, Modal, Select, Textarea, Spinner } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface FormState {
  employeeIds: string[];
  startDate: string;
  endDate: string;
  type: AbsenceType;
  reason: string;
  status: RequestStatus;
}

const emptyForm: FormState = {
  employeeIds: [],
  startDate: '',
  endDate: '',
  type: 'DESCUENTO_DIA',
  reason: '',
  status: 'APPROVED',
};

const TYPE_OPTIONS: AbsenceType[] = ['DESCUENTO_DIA', 'BAJA_ENFERMEDAD', 'TRAMITE_PERSONAL', 'GUARDIA', 'DIA_ESTUDIO'];

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const COLUMN_HEADERS = Array.from({ length: 42 }, (_, i) => WEEKDAYS[i % 7]);

interface AbsencesProps {
  view: 'calendar' | 'list';
}

export default function Absences({ view }: AbsencesProps) {
  const { user, isAdmin, isManager } = useAuth();
  
  const [allAbsences, setAllAbsences] = useState<Absence[]>([]);
  const [selectedEmployeeAbsences, setSelectedEmployeeAbsences] = useState<Absence[]>([]);
  const [vacations, setVacations] = useState<VacationRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Absence | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [listYearFilter, setListYearFilter] = useState<string>(new Date().getFullYear().toString());
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2017;
    const endYear = currentYear + 2;
    const length = endYear - startYear + 1;
    return Array.from({ length }, (_, i) => startYear + i);
  }, []);

  async function refreshAllAbsences() {
    try {
      const { data } = await api.get<Absence[]>('/absences');
      setAllAbsences(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function refreshEmployeeData(empId: string) {
    if (!empId) return;
    setLoadingData(true);
    try {
      const [absRes, vacRes] = await Promise.all([
        api.get<Absence[]>('/absences', { params: { employeeId: empId } }),
        api.get<VacationRequest[]>(`/employees/${empId}/vacations`)
      ]);
      setSelectedEmployeeAbsences(absRes.data);
      setVacations(vacRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar datos del empleado');
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const [absRes, empRes, holRes] = await Promise.all([
          api.get<Absence[]>('/absences'),
          api.get<Employee[]>('/employees'),
          api.get<Holiday[]>('/holidays')
        ]);
        setAllAbsences(absRes.data);
        const activeEmps = empRes.data.filter((e) => e.status === 'ACTIVE');
        setEmployees(activeEmps);
        setHolidays(holRes.data);

        if (user?.employeeId) {
          setSelectedEmployeeId(user.employeeId);
        } else if (activeEmps.length > 0) {
          setSelectedEmployeeId(activeEmps[0].id);
        }
      } catch (err) {
        console.error(err);
        toast.error('Error al cargar datos iniciales');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  useEffect(() => {
    if (selectedEmployeeId) {
      refreshEmployeeData(selectedEmployeeId);
    }
  }, [selectedEmployeeId]);

  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmployeeId);
  }, [employees, selectedEmployeeId]);

  const getCellStatus = (dateStr: string) => {
    // Check holidays
    const holiday = holidays.find(h => h.date.slice(0, 10) === dateStr);
    if (holiday) return { type: 'holiday', label: holiday.name, color: '#94a3b8', deductsVacation: holiday.deductsVacation };

    // Check vacations
    const vacation = vacations.find(v => {
      const start = v.startDate.slice(0, 10);
      const end = v.endDate.slice(0, 10);
      return v.status === 'APPROVED' && dateStr >= start && dateStr <= end;
    });
    if (vacation) return { type: 'vacation', label: 'Vacaciones', color: '#f97316', reason: vacation.reason };

    // Check absences
    const absence = selectedEmployeeAbsences.find(a => {
      const start = a.startDate.slice(0, 10);
      const end = a.endDate.slice(0, 10);
      return a.status === 'APPROVED' && dateStr >= start && dateStr <= end;
    });
    if (absence) {
      return {
        type: 'absence',
        absenceType: absence.type,
        label: ABSENCE_TYPE_LABELS[absence.type],
        color: ABSENCE_TYPE_COLORS[absence.type],
        reason: absence.reason
      };
    }

    return null;
  };

  const getStatsForYear = (year: number) => {
    let totalBajas = 0;
    let totalVacaciones = 0;
    let totalEnfermedad = 0;
    let totalTramitesEstudio = 0;
    let totalDescuento = 0;
    let totalGuardia = 0;
    let diasHabiles = 0;
    let diasDeBajaHabiles = 0;

    for (let m = 0; m < 12; m++) {
      const days = new Date(year, m + 1, 0).getDate();
      for (let d = 1; d <= days; d++) {
        const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayOfWeek = new Date(year, m, d).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = holidays.some(h => h.date.slice(0, 10) === dateStr);

        if (!isWeekend && !isHoliday) {
          diasHabiles++;
        }

        const isVacation = vacations.some(v => {
          const start = v.startDate.slice(0, 10);
          const end = v.endDate.slice(0, 10);
          return v.status === 'APPROVED' && dateStr >= start && dateStr <= end;
        });

        const matchingAbsence = selectedEmployeeAbsences.find(a => {
          const start = a.startDate.slice(0, 10);
          const end = a.endDate.slice(0, 10);
          return a.status === 'APPROVED' && dateStr >= start && dateStr <= end;
        });

        if (isVacation) {
          totalBajas++;
          totalVacaciones++;
          if (!isWeekend && !isHoliday) {
            diasDeBajaHabiles++;
          }
        } else if (matchingAbsence) {
          totalBajas++;
          if (!isWeekend && !isHoliday) {
            diasDeBajaHabiles++;
          }
          if (matchingAbsence.type === 'BAJA_ENFERMEDAD') {
            totalEnfermedad++;
          } else if (matchingAbsence.type === 'TRAMITE_PERSONAL' || matchingAbsence.type === 'DIA_ESTUDIO' || matchingAbsence.type === 'OTHER') {
            totalTramitesEstudio++;
          } else if (matchingAbsence.type === 'DESCUENTO_DIA') {
            totalDescuento++;
          } else if (matchingAbsence.type === 'GUARDIA') {
            totalGuardia++;
          }
        }
      }
    }

    const diasTrabajados = diasHabiles - diasDeBajaHabiles;

    return {
      totalBajas,
      totalVacaciones,
      totalEnfermedad,
      totalTramitesEstudio,
      totalDescuento,
      totalGuardia,
      diasHabiles,
      diasTrabajados
    };
  };

  const statsCurrent = useMemo(() => getStatsForYear(selectedYear), [selectedYear, selectedEmployeeAbsences, vacations, holidays]);
  const statsPrevious = useMemo(() => getStatsForYear(selectedYear - 1), [selectedYear, selectedEmployeeAbsences, vacations, holidays]);

  const getYoY = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? { text: 'ARRIBA 100%', positive: true } : { text: 'SIN CAMBIOS', neutral: true };
    }
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct > 0) return { text: `ARRIBA ${pct}%`, positive: true };
    if (pct < 0) return { text: `ABAJO ${Math.abs(pct)}%`, positive: false };
    return { text: 'SIN CAMBIOS', neutral: true };
  };

  const filteredList = useMemo(() => {
    return allAbsences.filter((a) => {
      const matchesType = typeFilter ? a.type === typeFilter : true;
      const absenceYear = new Date(a.startDate).getFullYear().toString();
      const matchesYear = listYearFilter ? absenceYear === listYearFilter : true;
      return matchesType && matchesYear;
    });
  }, [allAbsences, typeFilter, listYearFilter]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      employeeIds: selectedEmployeeId ? [selectedEmployeeId] : [],
    });
    setModalOpen(true);
  }

  function openEdit(a: Absence) {
    setEditing(a);
    setForm({
      employeeIds: [a.employeeId],
      startDate: a.startDate.slice(0, 10),
      endDate: a.endDate.slice(0, 10),
      type: a.type,
      reason: a.reason ?? '',
      status: a.status,
    });
    setModalOpen(true);
  }

  function toggleEmployee(id: string) {
    setForm((f) => ({
      ...f,
      employeeIds: f.employeeIds.includes(id) ? f.employeeIds.filter((e) => e !== id) : [...f.employeeIds, id],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.employeeIds.length === 0) {
      toast.error('Selecciona al menos un empleado');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/absences/${editing.id}`, {
          startDate: form.startDate,
          endDate: form.endDate,
          type: form.type,
          reason: form.reason || null,
          status: form.status,
        });
        toast.success('Baja actualizada');
      } else {
        await api.post('/absences', {
          employeeIds: form.employeeIds,
          startDate: form.startDate,
          endDate: form.endDate,
          type: form.type,
          reason: form.reason || null,
        });
        toast.success(form.employeeIds.length > 1 ? 'Bajas registradas' : 'Baja registrada');
      }
      setModalOpen(false);
      refreshAllAbsences();
      if (selectedEmployeeId) {
        refreshEmployeeData(selectedEmployeeId);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(a: Absence) {
    if (!confirm(`¿Eliminar la baja de ${a.employee.firstName} ${a.employee.lastName}?`)) return;
    try {
      await api.delete(`/absences/${a.id}`);
      toast.success('Baja eliminada');
      refreshAllAbsences();
      if (selectedEmployeeId) {
        refreshEmployeeData(selectedEmployeeId);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera Principal */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {view === 'calendar' && selectedEmployee
              ? `Asistencias: ${selectedEmployee.firstName} ${selectedEmployee.lastName}`
              : 'Asistencias e inasistencias'}
          </h1>
          <p className="text-muted-foreground">
            {view === 'calendar' && selectedEmployee
              ? `Sector: ${selectedEmployee.department.name} | Ingreso: ${new Date(selectedEmployee.hireDate).toLocaleDateString()}`
              : 'Monitorea y gestiona ausencias, licencias médicas y estados especiales del equipo'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {view === 'list' && (
            <>
              <Select value={listYearFilter} onChange={(e) => setListYearFilter(e.target.value)} className="w-32">
                <option value="">Todos los años</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-48">
                <option value="">Todos los tipos</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {ABSENCE_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </>
          )}
          {(isAdmin || isManager) && (
            <Button onClick={openCreate} className="shadow-sm">
              <Plus className="h-4 w-4 mr-1.5" /> Registrar baja
            </Button>
          )}
        </div>
      </div>

      {/* Sección de Estadísticas Clave - Arriba del todo */}
      {view === 'calendar' && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="Días de baja"
            value={statsCurrent.totalBajas}
            yoy={getYoY(statsCurrent.totalBajas, statsPrevious.totalBajas)}
            icon={Calendar}
            colorClass="text-blue-600 bg-blue-50 dark:bg-blue-500/10"
          />
          <StatCard
            label="Días trabajados"
            value={statsCurrent.diasTrabajados}
            yoy={getYoY(statsCurrent.diasTrabajados, statsPrevious.diasTrabajados)}
            icon={UserCheck}
            colorClass="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
          />
          <StatCard
            label="Días de Enfermedad"
            value={statsCurrent.totalEnfermedad}
            yoy={getYoY(statsCurrent.totalEnfermedad, statsPrevious.totalEnfermedad)}
            icon={HeartPulse}
            colorClass="text-sky-600 bg-sky-50 dark:bg-sky-500/10"
          />
          <StatCard
            label="De vacaciones"
            value={statsCurrent.totalVacaciones}
            yoy={getYoY(statsCurrent.totalVacaciones, statsPrevious.totalVacaciones)}
            icon={Plane}
            colorClass="text-orange-600 bg-orange-50 dark:bg-orange-500/10"
          />
          <StatCard
            label="Trámites y Estudio"
            value={statsCurrent.totalTramitesEstudio}
            yoy={getYoY(statsCurrent.totalTramitesEstudio, statsPrevious.totalTramitesEstudio)}
            icon={FileText}
            colorClass="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
          />
          <StatCard
            label="Descuento Día"
            value={statsCurrent.totalDescuento}
            yoy={getYoY(statsCurrent.totalDescuento, statsPrevious.totalDescuento)}
            icon={AlertCircle}
            colorClass="text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10"
          />
        </div>
      )}

      {/* Vistas de Tabs */}
      {view === 'calendar' ? (
        <div className="space-y-6">
          {/* Barra de Filtros de Calendario compacta */}
          <Card className="p-3 flex flex-wrap items-center gap-6 shadow-sm bg-card/60 backdrop-blur">
            {(isAdmin || isManager) && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Empleado</span>
                <Select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} className="w-64 h-9 py-0">
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.lastName}, {emp.firstName}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Año</span>
              <Select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-28 h-9 py-0">
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          {/* Grid de dos columnas: 2/3 Calendario, 1/3 Resumen lateral */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Columna Izquierda: Calendario y Leyenda */}
            <div className="xl:col-span-2 space-y-6">
              {loadingData ? (
                <Card className="flex h-96 items-center justify-center">
                  <Spinner className="h-8 w-8" />
                </Card>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
                  <table className="w-full border-collapse text-xs table-fixed min-w-[900px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 h-9">
                        <th className="w-24 p-2 text-left font-bold text-muted-foreground bg-card sticky left-0 z-10 border-r border-border/30 capitalize">Mes</th>
                        {COLUMN_HEADERS.map((h, i) => (
                          <th key={i} className="p-1 text-center font-extrabold text-muted-foreground/80 border-l border-border/20">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MONTH_NAMES.map((monthName, m) => {
                        const firstDay = new Date(selectedYear, m, 1);
                        const startOfWeek = firstDay.getDay(); // 0 is Sunday, ..., 6 is Saturday
                        const daysInMonth = new Date(selectedYear, m + 1, 0).getDate();

                        return (
                          <tr key={m} className="border-b border-border last:border-0 hover:bg-muted/5 h-9">
                            <td className="p-2 font-bold capitalize bg-card sticky left-0 z-10 border-r border-border/30 text-foreground">
                              {monthName}
                            </td>
                            {Array.from({ length: 42 }).map((_, c) => {
                              const dayNum = c - startOfWeek + 1;
                              const isValidDay = dayNum >= 1 && dayNum <= daysInMonth;

                              if (!isValidDay) {
                                return <td key={c} className="p-1 bg-muted/10 border-l border-border/10" />;
                              }

                              const dateStr = `${selectedYear}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                              const cellStatus = getCellStatus(dateStr);
                              const dayOfWeek = new Date(selectedYear, m, dayNum).getDay();
                              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                              let bgStyle = {};
                              let className = "p-1 text-center font-semibold border-l border-border/15 transition-all relative group ";
                              let titleText = `Día ${dayNum}`;

                              if (cellStatus) {
                                if (cellStatus.type === 'holiday') {
                                  bgStyle = { backgroundColor: '#cbd5e144', color: '#475569' };
                                  className += "cursor-help border border-slate-300 dark:border-slate-600 ";
                                } else {
                                  bgStyle = { backgroundColor: cellStatus.color + '25', color: cellStatus.color };
                                  className += "cursor-help ring-1 ring-inset ring-current ";
                                }
                                titleText = `${cellStatus.label}${cellStatus.reason ? ` - ${cellStatus.reason}` : ''}`;
                              } else if (isWeekend) {
                                className += "bg-muted/20 text-muted-foreground/50 ";
                              } else {
                                className += "text-foreground hover:bg-muted/40 cursor-default ";
                              }

                              return (
                                <td
                                  key={c}
                                  className={className}
                                  style={bgStyle}
                                  title={titleText}
                                >
                                  {dayNum}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Leyenda */}
              <Card className="flex flex-wrap items-center gap-4 p-4 text-xs shadow-sm bg-card/40 border border-border/60">
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded border border-orange-500 bg-orange-500/15" />
                  <span className="font-medium text-muted-foreground">Vacaciones</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded border border-sky-400 bg-sky-400/15" />
                  <span className="font-medium text-muted-foreground">Enfermedad</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded border border-emerald-400 bg-emerald-400/15" />
                  <span className="font-medium text-muted-foreground">Trámites / Estudio</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded border border-yellow-400 bg-yellow-400/15" />
                  <span className="font-medium text-muted-foreground">Descuento Día</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded border border-purple-400 bg-purple-400/15" />
                  <span className="font-medium text-muted-foreground">Guardia</span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="h-3.5 w-3.5 rounded bg-muted/40 border border-border/20" />
                  <span className="font-medium text-muted-foreground">Fin de semana / Feriado</span>
                </div>
              </Card>
            </div>

            {/* Columna Derecha: Resumen de bajas */}
            <div className="xl:col-span-1">
              <Card className="p-5 h-full max-h-[500px] xl:max-h-none xl:h-[483px] flex flex-col">
                <div className="mb-4 flex items-center gap-2 border-b border-border pb-3 shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-sm">Resumen de bajas {selectedYear}</h2>
                </div>
                {selectedEmployeeAbsences.filter(a => new Date(a.startDate).getFullYear() === selectedYear).length > 0 ? (
                  <div className="flex-1 overflow-y-auto pr-1">
                    <ul className="space-y-4">
                      {selectedEmployeeAbsences
                        .filter(a => new Date(a.startDate).getFullYear() === selectedYear)
                        .map((a) => (
                          <li key={a.id} className="flex flex-col gap-1 text-xs border-b border-border/40 pb-3 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between">
                              <span
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border"
                                style={{
                                  backgroundColor: `${ABSENCE_TYPE_COLORS[a.type]}15`,
                                  borderColor: ABSENCE_TYPE_COLORS[a.type],
                                  color: ABSENCE_TYPE_COLORS[a.type]
                                }}
                              >
                                {ABSENCE_TYPE_LABELS[a.type]}
                              </span>
                              <span className="text-muted-foreground font-semibold">
                                {a.daysCount} día(s)
                              </span>
                            </div>
                            <div className="flex justify-between font-bold text-foreground mt-1">
                              <span>{formatDate(a.startDate)} al {formatDate(a.endDate)}</span>
                            </div>
                            {a.reason && (
                              <p className="text-muted-foreground bg-muted/40 p-1.5 rounded mt-1 italic border border-border/10">
                                "{a.reason}"
                              </p>
                            )}
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : (
                  <div className="py-20 text-center text-sm text-muted-foreground flex flex-col items-center justify-center space-y-2 flex-1">
                    <UserCheck className="h-8 w-8 opacity-40" />
                    <span>Sin bajas registradas este año</span>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* Tabla Plana e Historial Completo */
        <Card className="shadow-sm">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
              <ShieldAlert className="h-10 w-10 text-muted-foreground/40" />
              <p>No hay bajas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-muted-foreground bg-muted/10">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Empleado</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Inicio</th>
                    <th className="px-4 py-3 font-semibold">Fin</th>
                    <th className="px-4 py-3 font-semibold">Días</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Motivo</th>
                    {(isAdmin || isManager) && <th className="px-4 py-3" />}
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{a.employee.firstName} {a.employee.lastName}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border"
                          style={{
                            backgroundColor: `${ABSENCE_TYPE_COLORS[a.type]}15`,
                            borderColor: ABSENCE_TYPE_COLORS[a.type],
                            color: ABSENCE_TYPE_COLORS[a.type]
                          }}
                        >
                          {ABSENCE_TYPE_LABELS[a.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(a.startDate)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(a.endDate)}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{a.daysCount}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          a.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400' :
                          a.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400' :
                          'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}>
                          {a.status === 'APPROVED' ? 'Aprobado' : a.status === 'PENDING' ? 'Pendiente' : 'Rechazado'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]" title={a.reason ?? ''}>
                        {a.reason ?? '—'}
                      </td>
                      {(isAdmin || isManager) && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEdit(a)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => remove(a)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modal de CRUD */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar baja' : 'Nueva baja'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button form="absence-form" type="submit" loading={saving}>
              {editing ? 'Guardar cambios' : 'Registrar'}
            </Button>
          </>
        }
      >
        <form id="absence-form" onSubmit={submit} className="space-y-4">
          {!editing && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Empleados</label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2 bg-card">
                {employees.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      className="rounded text-primary focus:ring-primary h-4 w-4 border-border"
                      checked={form.employeeIds.includes(emp.id)}
                      onChange={() => toggleEmployee(emp.id)}
                    />
                    <span className="text-foreground">{emp.firstName} {emp.lastName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha de inicio" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            <Input label="Fecha de fin" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          </div>
          <Select label="Tipo de baja" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AbsenceType })}>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {ABSENCE_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
          {editing && (
            <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RequestStatus })}>
              <option value="PENDING">Pendiente</option>
              <option value="APPROVED">Aprobado</option>
              <option value="REJECTED">Rechazado</option>
            </Select>
          )}
          <Textarea label="Observaciones" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} />
        </form>
      </Modal>
    </div>
  );
}

function StatCard({
  label,
  value,
  yoy,
  icon: Icon,
  colorClass
}: {
  label: string;
  value: number;
  yoy: { text: string; positive?: boolean; neutral?: boolean };
  icon: any;
  colorClass: string;
}) {
  return (
    <Card className="p-5 flex flex-col justify-between space-y-4 shadow-sm border border-border/80">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className={`p-2.5 rounded-xl ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-foreground leading-none">{value}</p>
        <div className="mt-2.5">
          {yoy.neutral ? (
            <span className="inline-flex items-center text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
              {yoy.text}
            </span>
          ) : yoy.positive ? (
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
              label === 'Días trabajados'
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                : 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20'
            }`}>
              {label === 'Días trabajados' ? <ChevronUp className="h-3 w-3" /> : <ChevronUp className="h-3 w-3 text-rose-500" />}
              {yoy.text}
            </span>
          ) : (
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
              label === 'Días trabajados'
                ? 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20'
                : 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20'
            }`}>
              {label === 'Días trabajados' ? <ChevronDown className="h-3 w-3 text-rose-500" /> : <ChevronDown className="h-3 w-3" />}
              {yoy.text}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
