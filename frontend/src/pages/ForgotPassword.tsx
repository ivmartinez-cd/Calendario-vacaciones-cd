import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Button, Card, Input } from '@/components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Si el email existe, recibirás instrucciones.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="mb-2 text-2xl font-bold">Recuperar contraseña</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
        </p>
        {sent ? (
          <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            Revisa tu bandeja de entrada (y la consola del backend en desarrollo).
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              Enviar enlace
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
