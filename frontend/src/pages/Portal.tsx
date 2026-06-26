import { useNavigate } from 'react-router-dom';
import { CalendarRange, ClipboardList, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const modules = [
  {
    key: 'vacations',
    title: 'Gestión de Vacaciones',
    description:
      'Administración de calendarios de equipo, solicitudes de licencias, auditoría de ciclos anuales y arrastre de días.',
    path: '/vacations',
    icon: CalendarRange,
    available: true,
  },
  {
    key: 'attendance',
    title: 'Registro de Asistencias',
    description:
      'Monitoreo del ingreso y egreso del personal, control de horarios, horas extras y ausentismo del equipo.',
    path: '/attendance',
    icon: ClipboardList,
    available: false,
  },
] as const;

export default function Portal() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-[#1a1a1a] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/8">
        <img src="/logo-white.svg" alt="Canal Directo" className="h-8 w-auto" />
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/50">
            <span className="text-white/80 font-medium">{user?.name}</span>
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 hover:border-white/20 hover:text-white transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="mb-12 text-center">
          <span className="inline-block rounded-full border border-[#F7941D]/30 bg-[#F7941D]/10 px-4 py-1 text-xs font-semibold text-[#F7941D] tracking-widest uppercase mb-6">
            Portal de Administración
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            ¿A qué módulo ingresás?
          </h1>
          <p className="mt-3 text-sm text-white/40 max-w-md mx-auto">
            Seleccioná el sistema al que querés acceder.
          </p>
        </div>

        <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
          {modules.map((mod) => (
            <div
              key={mod.key}
              onClick={() => mod.available && navigate(mod.path)}
              className={[
                'group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-7 transition-all duration-200',
                mod.available
                  ? 'border-white/10 bg-white/4 hover:border-[#F7941D]/50 hover:bg-white/7 cursor-pointer'
                  : 'border-white/6 bg-white/2 opacity-50 cursor-not-allowed',
              ].join(' ')}
            >
              <div>
                <div className={[
                  'mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200',
                  mod.available ? 'bg-[#F7941D]/15 text-[#F7941D] group-hover:scale-105' : 'bg-white/8 text-white/30',
                ].join(' ')}>
                  <mod.icon className="h-6 w-6" />
                </div>
                <h2 className="text-base font-bold text-white mb-2">{mod.title}</h2>
                <p className="text-sm text-white/45 leading-relaxed">{mod.description}</p>
              </div>

              <div className={[
                'mt-6 flex items-center gap-1 text-xs font-semibold transition',
                mod.available ? 'text-[#F7941D] group-hover:gap-2' : 'text-white/20',
              ].join(' ')}>
                {mod.available ? (
                  <>Ingresar al módulo <ChevronRight className="h-3.5 w-3.5" /></>
                ) : (
                  'Próximamente'
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Isotipo decorativo de fondo */}
      <img
        src="/isotipo-white.svg"
        alt=""
        aria-hidden="true"
        className="fixed bottom-0 right-0 h-64 w-64 opacity-[0.03] select-none pointer-events-none"
      />
    </div>
  );
}
