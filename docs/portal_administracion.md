# Propuesta Técnica: Portal de Selección de Módulo para Administradores

Este documento describe la especificación técnica para implementar una página de selección de portal ("Selector de Módulos") para usuarios administradores. Esto permitirá separar el módulo actual de **Vacaciones** del futuro módulo de **Registro de Asistencias**.

---

## 1. Flujo de Usuario y Experiencia (UX)

### A. Para Administradores (ADMIN):
1. **Inicio de Sesión:** Tras hacer login con éxito, el administrador es redirigido a la ruta raíz `/` (o `/portal`).
2. **Página de Portal (Selector):** 
   - Se muestra una interfaz a pantalla completa (sin el sidebar del sistema de vacaciones).
   - Contiene dos tarjetas interactivas grandes con diseño premium, efectos hover y microanimaciones:
     - **Módulo de Vacaciones (Vacasync):** Al hacer clic, ingresa al sistema actual de vacaciones (con su barra lateral y vistas correspondientes).
     - **Módulo de Registro de Asistencias:** Al hacer clic, ingresa a un módulo vacío (con un skeleton de carga o placeholder) que servirá para futuros desarrollos.
3. **Cambio de Módulo:** En el encabezado superior o barra lateral de cada módulo, el administrador dispondrá de un botón para "Cambiar de módulo" que lo regresará al Selector.

### B. Para Empleados (EMPLOYEE):
- El portal de selección se omite completamente. Al iniciar sesión, son redirigidos directamente al dashboard de vacaciones, sin pasar por la página de selección.
- Si intentan entrar a `/portal`, el sistema los redirigirá automáticamente a su vista de vacaciones.

---

## 2. Especificación de Rutas (`App.tsx`)

Se propone reestructurar las rutas para soportar módulos independientes:

```tsx
// frontend/src/App.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Spinner } from './components/ui';

const Login = lazy(() => import('./pages/Login'));
const Portal = lazy(() => import('./pages/Portal')); // NUEVA PÁGINA
const AttendancePlaceholder = lazy(() => import('./pages/AttendancePlaceholder')); // NUEVA PÁGINA

// Páginas de vacaciones (dentro del Layout actual)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TeamCalendar = lazy(() => import('./pages/TeamCalendar'));
const Requests = lazy(() => import('./pages/Requests'));
const Approvals = lazy(() => import('./pages/Approvals'));
const Employees = lazy(() => import('./pages/Employees'));
const Departments = lazy(() => import('./pages/Departments'));
const Reports = lazy(() => import('./pages/Reports'));
const Holidays = lazy(() => import('./pages/Holidays'));
const Audit = lazy(() => import('./pages/Audit'));
const Settings = lazy(() => import('./pages/Settings'));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />

        {/* Ruta Raíz - Redirige según Rol y Selección */}
        <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />

        {/* Portal de Selección (Solo para Administradores) */}
        <Route path="/portal" element={<ProtectedRoute adminOnly><Portal /></ProtectedRoute>} />

        {/* Módulo 1: Registro de Asistencias (Futuro Desarrollo) */}
        <Route path="/attendance/*" element={<ProtectedRoute adminOnly><AttendancePlaceholder /></ProtectedRoute>} />

        {/* Módulo 2: Vacaciones (Actual VacaSync) */}
        <Route path="/vacations" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/vacations/calendar" element={<ProtectedRoute><TeamCalendar /></ProtectedRoute>} />
        <Route path="/vacations/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
        <Route path="/vacations/approvals" element={<ProtectedRoute adminOnly><Approvals /></ProtectedRoute>} />
        <Route path="/vacations/employees" element={<ProtectedRoute adminOnly><Employees /></ProtectedRoute>} />
        <Route path="/vacations/departments" element={<ProtectedRoute adminOnly><Departments /></ProtectedRoute>} />
        <Route path="/vacations/reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
        <Route path="/vacations/holidays" element={<ProtectedRoute adminOnly><Holidays /></ProtectedRoute>} />
        <Route path="/vacations/audit" element={<ProtectedRoute adminOnly><Audit /></ProtectedRoute>} />
        <Route path="/vacations/settings" element={<ProtectedRoute adminOnly><Settings /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
}

// Redirección inicial inteligente
function RootRedirect() {
  const { user, isAdmin } = useAuth();
  if (isAdmin) {
    return <Navigate to="/portal" replace />;
  }
  return <Navigate to="/vacations" replace />;
}
```

---

## 3. Implementación del Componente de Selección (`Portal.tsx`)

A continuación, se detalla un borrador del nuevo componente `Portal.tsx` utilizando Tailwind y diseño de tarjetas premium:

```tsx
// frontend/src/pages/Portal.tsx
import { useNavigate } from 'react-router-dom';
import { CalendarRange, ClipboardSignature, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui';

export default function Portal() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b1329] text-slate-100 px-4">
      {/* Encabezado */}
      <div className="absolute top-6 right-6 flex items-center gap-4">
        <span className="text-sm text-slate-400">Sesión de: <strong className="text-white">{user?.name}</strong></span>
        <button onClick={logout} className="flex items-center gap-2 rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-600/30 transition">
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>

      <div className="mb-12 text-center">
        <img src="/logo.png" alt="Canal Directo" className="mx-auto h-12 mb-4" />
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Portal de Administración</h1>
        <p className="mt-2 text-slate-400">Selecciona el módulo del sistema al que deseas acceder</p>
      </div>

      {/* Rejilla de Módulos */}
      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
        
        {/* Tarjeta: Vacaciones */}
        <Card 
          onClick={() => navigate('/vacations')}
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-8 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:bg-slate-900 shadow-xl"
        >
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 transition group-hover:scale-110">
            <CalendarRange className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Gestión de Vacaciones</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Administración de calendarios de equipo, solicitudes de licencias, auditoría de ciclos anuales y arrastre de días de vacaciones de empleados.
            </p>
          </div>
          <div className="mt-8 text-xs font-semibold text-blue-400 flex items-center gap-1 group-hover:underline">
            Ingresar al módulo &rarr;
          </div>
        </Card>

        {/* Tarjeta: Asistencias */}
        <Card 
          onClick={() => navigate('/attendance')}
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-8 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:bg-slate-900 shadow-xl"
        >
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 transition group-hover:scale-110">
            <ClipboardSignature className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Registro de Asistencias</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Monitoreo y control del ingreso y egreso del personal, control de horarios, horas extras y ausentismo general del equipo.
            </p>
          </div>
          <div className="mt-8 text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:underline">
            Ingresar al módulo &rarr;
          </div>
        </Card>

      </div>
    </div>
  );
}
```

---

## 4. Modificaciones en el Layout de Navegación (`Layout.tsx`)

Para permitir que el administrador pueda volver al selector sin tener que cerrar sesión, se propone añadir un botón en la barra superior o en el sidebar.

### Modificación en Barra de Navegación (`Layout.tsx` Header):
Ubicado junto al botón de cerrar sesión o en el perfil de usuario:

```tsx
// Insertar antes del botón de Cerrar Sesión en Header (Layout.tsx):
{isAdmin && (
  <button 
    onClick={() => navigate('/portal')} 
    className="mr-2 flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
    title="Cambiar de módulo"
  >
    <LayoutGrid className="h-3.5 w-3.5" />
    <span className="hidden sm:inline">Cambiar módulo</span>
  </button>
)}
```
