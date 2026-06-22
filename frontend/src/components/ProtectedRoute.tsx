import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from './ui';
import Layout from './Layout';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  noLayout?: boolean;
}

export function ProtectedRoute({ children, adminOnly, noLayout }: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/vacations" replace />;
  if (noLayout) return <>{children}</>;

  return <Layout>{children}</Layout>;
}
