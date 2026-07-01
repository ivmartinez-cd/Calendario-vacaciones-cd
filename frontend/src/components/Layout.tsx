import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ClipboardCheck,
  BarChart3,
  Building2,
  ScrollText,
  Sun,
  Moon,
  Bell,
  LogOut,
  Menu,
  PartyPopper,
  Settings,
  LayoutGrid,
  Briefcase,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/lib/api';
import { AppNotification } from '@/types';
import { cn, formatDate } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
  managerOrAdmin?: boolean;
}

const vacationNavItems: NavItem[] = [
  { to: '/vacations', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vacations/requests', label: 'Mis solicitudes', icon: CalendarCheck },
  { to: '/vacations/approvals', label: 'Aprobaciones', icon: ClipboardCheck, managerOrAdmin: true },
  { to: '/vacations/reports', label: 'Reportes', icon: BarChart3, adminOnly: true },
  { to: '/vacations/audit', label: 'Auditoría', icon: ScrollText, adminOnly: true },
  { to: '/vacations/settings', label: 'Configuración', icon: Settings, adminOnly: true },
];

const attendanceNavItems: NavItem[] = [
  { to: '/attendance', label: 'Vista Calendario', icon: LayoutDashboard },
  { to: '/attendance/list', label: 'Listado y Registros', icon: ScrollText },
];

const hrNavItems: NavItem[] = [
  { to: '/hr/employees', label: 'Empleados', icon: Users, adminOnly: true },
  { to: '/hr/departments', label: 'Sectores', icon: Building2, adminOnly: true },
  { to: '/hr/positions', label: 'Cargos', icon: Briefcase, adminOnly: true },
  { to: '/hr/holidays', label: 'Feriados', icon: PartyPopper, adminOnly: true },
  { to: '/hr/users', label: 'Usuarios y Roles', icon: ShieldCheck, adminOnly: true },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isManager, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAttendanceRoute = location.pathname.startsWith('/attendance');
  const isHrRoute = location.pathname.startsWith('/hr');

  let activeNavItems = vacationNavItems;
  let sidebarTitle = 'Gestión de Vacaciones';

  if (isAttendanceRoute) {
    activeNavItems = attendanceNavItems;
    sidebarTitle = 'Gestión de Asistencias';
  } else if (isHrRoute) {
    activeNavItems = hrNavItems;
    sidebarTitle = 'Gestión Humana';
  }

  const items = activeNavItems.filter((i) => {
    if (i.adminOnly) return isAdmin;
    if (i.managerOrAdmin) return isAdmin || isManager;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar corporativo ──────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform transition-transform lg:translate-x-0 flex flex-col',
          'bg-[#1a1a1a]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Encabezado del sidebar */}
        <div className="flex h-[72px] flex-col items-center justify-center border-b border-white/10 px-6 gap-0.5">
          <img src="/logo-white.svg" alt="Canal Directo" className="h-8 w-auto" />
          <span className="text-[9px] font-semibold tracking-[0.2em] text-white/40 uppercase mt-1">
            {sidebarTitle}
          </span>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/vacations' || item.to === '/attendance' || item.to === '/hr/employees'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[#F7941D] text-white shadow-md shadow-[#F7941D]/30'
                    : 'text-white/60 hover:bg-white/8 hover:text-white',
                )
              }
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer del sidebar con info del usuario */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F7941D] text-xs font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">{user?.name}</p>
              <p className="text-[10px] text-white/40">
                {isAdmin ? 'Administrador' : isManager ? 'Jefe de sector' : (user?.position ?? 'Empleado')}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Contenido principal ──────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur lg:px-8">
          <button className="rounded-md p-2 hover:bg-muted lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            {(isAdmin || isManager) && (
              <button
                onClick={() => navigate('/portal')}
                className="mr-1 flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
                title="Cambiar de módulo"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cambiar módulo</span>
              </button>
            )}
            <NotificationBell />
            <button onClick={toggle} className="rounded-lg p-2 hover:bg-muted" title="Cambiar tema">
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            <div className="ml-1.5 flex items-center gap-2 border-l border-border pl-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{isAdmin ? 'Administrador' : isManager ? 'Jefe de sector' : (user?.position ?? 'Empleado')}</p>
              </div>
              <button onClick={logout} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title="Cerrar sesión">
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const { data } = await api.get<AppNotification[]>('/notifications');
      setItems(data);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const unread = items.filter((i) => !i.read).length;

  async function markAll() {
    await api.patch('/notifications/read-all');
    load();
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative rounded-lg p-2 hover:bg-muted">
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F7941D] px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-semibold text-sm">Notificaciones</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-primary hover:underline">
                Marcar todas como leídas
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Sin notificaciones</p>
            ) : (
              items.map((n) => (
                <div key={n.id} className={cn('border-b border-border px-4 py-3', !n.read && 'bg-primary/5')}>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(n.createdAt, 'dd/MM/yy HH:mm')}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
