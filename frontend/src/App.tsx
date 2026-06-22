import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Spinner } from './components/ui';

// Carga diferida (code-splitting) de cada página.
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TeamCalendar = lazy(() => import('./pages/TeamCalendar'));
const Requests = lazy(() => import('./pages/Requests'));
const Approvals = lazy(() => import('./pages/Approvals'));
const Employees = lazy(() => import('./pages/Employees'));
const Departments = lazy(() => import('./pages/Departments'));
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

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><TeamCalendar /></ProtectedRoute>} />
        <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
        <Route path="/approvals" element={<ProtectedRoute adminOnly><Approvals /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute adminOnly><Employees /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute adminOnly><Departments /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
        <Route path="/holidays" element={<ProtectedRoute adminOnly><Holidays /></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute adminOnly><Audit /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute adminOnly><Settings /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
}
