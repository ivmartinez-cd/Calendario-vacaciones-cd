import { useNavigate } from 'react-router-dom';
import { CalendarRange, ClipboardList, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const modules = [
  {
    key: 'vacations',
    title: 'Gestión de Vacaciones',
    description:
      'Administración de calendarios de equipo, solicitudes de licencias, auditoría de ciclos anuales y arrastre de días de vacaciones de empleados.',
    path: '/vacations',
    icon: CalendarRange,
    color: 'blue',
  },
  {
    key: 'attendance',
    title: 'Registro de Asistencias',
    description:
      'Monitoreo y control del ingreso y egreso del personal, control de horarios, horas extras y ausentismo general del equipo.',
    path: '/attendance',
    icon: ClipboardList,
    color: 'emerald',
  },
] as const;

const colorMap = {
  blue: {
    border: 'hover:border-blue-500',
    iconBg: 'bg-blue-500/10',
    iconText: 'text-blue-500',
    link: 'text-blue-400',
  },
  emerald: {
    border: 'hover:border-emerald-500',
    iconBg: 'bg-emerald-500/10',
    iconText: 'text-emerald-500',
    link: 'text-emerald-400',
  },
} as const;

export default function Portal() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b1329] text-slate-100 px-4">
      <div className="absolute top-6 right-6 flex items-center gap-4">
        <span className="text-sm text-slate-400">
          Sesión de: <strong className="text-white">{user?.name}</strong>
        </span>
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-600/30 transition"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>

      <div className="mb-12 text-center">
        <img src="/logo.png" alt="Canal Directo" className="mx-auto h-12 mb-4" />
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Portal de Administración</h1>
        <p className="mt-2 text-slate-400">Selecciona el módulo del sistema al que deseas acceder</p>
      </div>

      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
        {modules.map((mod) => {
          const c = colorMap[mod.color];
          return (
            <div
              key={mod.key}
              onClick={() => navigate(mod.path)}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-8 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:bg-slate-900 shadow-xl ${c.border}`}
            >
              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${c.iconBg} ${c.iconText} transition group-hover:scale-110`}>
                <mod.icon className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">{mod.title}</h2>
                <p className="text-sm text-slate-400 leading-relaxed">{mod.description}</p>
              </div>
              <div className={`mt-8 text-xs font-semibold ${c.link} flex items-center gap-1 group-hover:underline`}>
                Ingresar al módulo &rarr;
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
