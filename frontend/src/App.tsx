import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { Spinner } from './components/ui';

const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Portal = lazy(() => import('./pages/Portal'));
const Attendance = lazy(() => import('./pages/Attendance'));

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Requests = lazy(() => import('./pages/Requests'));
const Approvals = lazy(() => import('./pages/Approvals'));
const Employees = lazy(() => import('./pages/Employees'));
const Departments = lazy(() => import('./pages/Departments'));
const Positions = lazy(() => import('./pages/Positions'));
const Reports = lazy(() => import('./pages/Reports'));
const Audit = lazy(() => import('./pages/Audit'));
const Holidays = lazy(() => import('./pages/Holidays'));
const Settings = lazy(() => import('./pages/Settings'));
const UsersAndRoles = lazy(() => import('./pages/UsersAndRoles'));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

function RootRedirect() {
  const { isAdmin, isManager } = useAuth();
  return <Navigate to={(isAdmin || isManager) ? '/portal' : '/vacations'} replace />;
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

        {/* Portal de selección (admin y managers) */}
        <Route path="/portal" element={<ProtectedRoute managerOrAdmin noLayout><Portal /></ProtectedRoute>} />

        {/* Módulo: Registro de Asistencias (bajas/inasistencias) */}
        <Route path="/attendance/*" element={<ProtectedRoute managerOrAdmin><Attendance /></ProtectedRoute>} />

        {/* Módulo: Vacaciones */}
        <Route path="/vacations" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/vacations/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
        <Route path="/vacations/approvals" element={<ProtectedRoute managerOrAdmin><Approvals /></ProtectedRoute>} />
        <Route path="/hr/employees" element={<ProtectedRoute adminOnly><Employees /></ProtectedRoute>} />
        <Route path="/hr/departments" element={<ProtectedRoute adminOnly><Departments /></ProtectedRoute>} />
        <Route path="/hr/positions" element={<ProtectedRoute adminOnly><Positions /></ProtectedRoute>} />
        <Route path="/vacations/reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
        <Route path="/hr/holidays" element={<ProtectedRoute adminOnly><Holidays /></ProtectedRoute>} />
        <Route path="/hr/users" element={<ProtectedRoute adminOnly><UsersAndRoles /></ProtectedRoute>} />
        <Route path="/vacations/audit" element={<ProtectedRoute adminOnly><Audit /></ProtectedRoute>} />
        <Route path="/vacations/settings" element={<ProtectedRoute adminOnly><Settings /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
}
