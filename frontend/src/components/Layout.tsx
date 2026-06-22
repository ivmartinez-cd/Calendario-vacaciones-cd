import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
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
}

const navItems: NavItem[] = [
  { to: '/vacations', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vacations/calendar', label: 'Calendario de equipo', icon: CalendarDays },
  { to: '/vacations/requests', label: 'Mis solicitudes', icon: CalendarCheck },
  { to: '/vacations/approvals', label: 'Aprobaciones', icon: ClipboardCheck, adminOnly: true },
  { to: '/vacations/employees', label: 'Empleados', icon: Users, adminOnly: true },
  { to: '/vacations/departments', label: 'Sectores', icon: Building2, adminOnly: true },
  { to: '/vacations/holidays', label: 'Feriados', icon: PartyPopper, adminOnly: true },
  { to: '/vacations/reports', label: 'Reportes', icon: BarChart3, adminOnly: true },
  { to: '/vacations/audit', label: 'Auditoría', icon: ScrollText, adminOnly: true },
  { to: '/vacations/settings', label: 'Configuración', icon: Settings, adminOnly: true },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const items = navItems.filter((i) => !i.adminOnly || isAdmin);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-card transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 flex-col items-center justify-center border-b border-border px-6">
          <img src="/logo.png" alt="Canal Directo" className="h-7" />
          <span className="text-[10px] font-medium tracking-wider text-muted-foreground">VACACIONES</span>
        </div>
        <nav className="space-y-1 p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/vacations'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Contenido */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur lg:px-8">
          <button className="rounded-md p-2 hover:bg-muted lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => navigate('/portal')}
                className="mr-1 flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
                title="Cambiar de módulo"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cambiar módulo</span>
              </button>
            )}
            <NotificationBell />
            <button onClick={toggle} className="rounded-lg p-2 hover:bg-muted" title="Cambiar tema">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="ml-2 flex items-center gap-3 border-l border-border pl-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{isAdmin ? 'Administrador' : 'Empleado'}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <button onClick={logout} className="rounded-lg p-2 hover:bg-muted" title="Cerrar sesión">
                <LogOut className="h-5 w-5" />
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
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-semibold">Notificaciones</span>
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
