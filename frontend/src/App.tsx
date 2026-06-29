import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { Spinner } from './components/ui';

const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Portal = lazy(() => import('./pages/Portal'));
const AttendancePlaceholder = lazy(() => import('./pages/AttendancePlaceholder'));

const Dashboard = lazy(() => import('./pages/Dashboard'));
const TeamCalendar = lazy(() => import('./pages/TeamCalendar'));
const Requests = lazy(() => import('./pages/Requests'));
const Approvals = lazy(() => import('./pages/Approvals'));
const Employees = lazy(() => import('./pages/Employees'));
const Departments = lazy(() => import('./pages/Departments'));
const Positions = lazy(() => import('./pages/Positions'));
const Reports = lazy(() => import('./pages/Reports'));
const Audit = lazy(() => import('./pages/Audit'));
const Holidays = lazy(() => import('./pages/Holidays'));
const Settings = lazy(() => import('./pages/Settings'));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

function RootRedirect() {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? '/portal' : '/vacations'} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Raíz: redirige según rol */}
        <Route path="/" element={<ProtectedRoute noLayout><RootRedirect /></ProtectedRoute>} />

        {/* Portal de selección (solo admin) */}
        <Route path="/portal" element={<ProtectedRoute adminOnly noLayout><Portal /></ProtectedRoute>} />

        {/* Módulo: Asistencias (futuro) */}
        <Route path="/attendance/*" element={<ProtectedRoute adminOnly noLayout><AttendancePlaceholder /></ProtectedRoute>} />

        {/* Módulo: Vacaciones */}
        <Route path="/vacations" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/vacations/calendar" element={<ProtectedRoute><TeamCalendar /></ProtectedRoute>} />
        <Route path="/vacations/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
        <Route path="/vacations/approvals" element={<ProtectedRoute managerOrAdmin><Approvals /></ProtectedRoute>} />
        <Route path="/vacations/employees" element={<ProtectedRoute adminOnly><Employees /></ProtectedRoute>} />
        <Route path="/vacations/departments" element={<ProtectedRoute adminOnly><Departments /></ProtectedRoute>} />
        <Route path="/vacations/positions" element={<ProtectedRoute adminOnly><Positions /></ProtectedRoute>} />
        <Route path="/vacations/reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
        <Route path="/vacations/holidays" element={<ProtectedRoute adminOnly><Holidays /></ProtectedRoute>} />
        <Route path="/vacations/audit" element={<ProtectedRoute adminOnly><Audit /></ProtectedRoute>} />
        <Route path="/vacations/settings" element={<ProtectedRoute adminOnly><Settings /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
}
