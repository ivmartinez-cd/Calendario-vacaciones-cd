import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Button, Card, Input } from '@/components/ui';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return toast.error('Las contraseñas no coinciden');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Contraseña actualizada. Ya puedes iniciar sesión.');
      navigate('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="mb-6 text-2xl font-bold">Nueva contraseña</h1>
        {!token ? (
          <p className="text-sm text-red-500">Token no válido. Solicita un nuevo enlace.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="password"
              label="Nueva contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <Input
              id="confirm"
              label="Confirmar contraseña"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              Actualizar contraseña
            </Button>
          </form>
        )}
        <Link to="/login" className="mt-6 block text-center text-sm text-primary hover:underline">
          Volver al inicio de sesión
        </Link>
      </Card>
    </div>
  );
}
