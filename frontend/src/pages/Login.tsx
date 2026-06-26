import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, X, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api, getErrorMessage } from '@/lib/api';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

// ── Validación de contraseña ─────────────────────────────────────────────────
function passwordRules(p: string) {
  return {
    length:    p.length >= 8,
    uppercase: /[A-Z]/.test(p),
    number:    /[0-9]/.test(p),
    special:   /[^A-Za-z0-9]/.test(p),
  };
}

function PasswordStrength({ password }: { password: string }) {
  const rules = passwordRules(password);
  if (!password) return null;
  const labels: [keyof typeof rules, string][] = [
    ['length',    'Mínimo 8 caracteres'],
    ['uppercase', 'Una mayúscula'],
    ['number',    'Un número'],
    ['special',   'Un carácter especial'],
  ];
  return (
    <ul className="mt-2 space-y-1">
      {labels.map(([key, label]) => (
        <li key={key} className={cn('flex items-center gap-1.5 text-xs', rules[key] ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
          <CheckCircle2 className={cn('h-3 w-3', rules[key] ? 'opacity-100' : 'opacity-30')} />
          {label}
        </li>
      ))}
    </ul>
  );
}

// ── Modal olvidé mi contraseña ───────────────────────────────────────────────
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const rules = passwordRules(password);
  const pwdValid = Object.values(rules).every(Boolean);

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // Verificar que el email existe antes de avanzar
    setLoading(true);
    try {
      await api.post('/auth/direct-reset', { email, password: 'Placeholder0!' });
    } catch (err: any) {
      // Si el error es "email no existe", mostrarlo
      if (err?.response?.data?.message?.includes('No existe')) {
        toast.error(err.response.data.message);
        setLoading(false);
        return;
      }
      // Cualquier otro error (ej: contraseña inválida) significa que el email SÍ existe → avanzar
    } finally {
      setLoading(false);
    }
    setStep(2);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    if (!pwdValid) return toast.error('La contraseña no cumple todos los requisitos');
    if (password !== confirm) return toast.error('Las contraseñas no coinciden');
    setLoading(true);
    try {
      await api.post('/auth/direct-reset', { email, password });
      setDone(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            {step === 2 && !done && (
              <button onClick={() => setStep(1)} className="rounded-lg p-1 hover:bg-muted text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold">
                {done ? 'Contraseña actualizada' : 'Cambiar contraseña'}
              </h2>
              {!done && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Paso {step} de 2 — {step === 1 ? 'Verificá tu email' : 'Ingresá la nueva contraseña'}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-6">
          {/* Paso final: éxito */}
          {done ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10">
                <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold">¡Listo! Tu contraseña fue cambiada.</p>
                <p className="text-sm text-muted-foreground mt-1">Ya podés iniciar sesión con tu nueva contraseña.</p>
              </div>
              <Button onClick={onClose} className="w-full mt-2">Ir al inicio de sesión</Button>
            </div>
          ) : step === 1 ? (
            /* Paso 1: email */
            <form onSubmit={handleStep1} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ingresá el email con el que accedés al sistema para continuar.
              </p>
              <Input
                id="forgot-email"
                label="Email corporativo"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.nombre@canaldirecto.com"
                required
                autoFocus
              />
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" loading={loading} className="flex-1">
                  Continuar
                </Button>
              </div>
            </form>
          ) : (
            /* Paso 2: nueva contraseña */
            <form onSubmit={handleStep2} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Creá una contraseña segura para <strong className="text-foreground">{email}</strong>.
              </p>

              {/* Nueva contraseña con toggle */}
              <div>
                <label htmlFor="new-pwd" className="mb-1.5 block text-sm font-medium">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="new-pwd"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    placeholder="••••••••"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label htmlFor="confirm-pwd" className="mb-1.5 block text-sm font-medium">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    id="confirm-pwd"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={cn(
                      'w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
                      confirm && password !== confirm ? 'border-red-400' : 'border-border',
                    )}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirm && password !== confirm && (
                  <p className="mt-1 text-xs text-red-500">Las contraseñas no coinciden</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Atrás
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="flex-1"
                  disabled={!pwdValid || password !== confirm}
                >
                  Cambiar contraseña
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Indicador de pasos */}
        {!done && (
          <div className="flex gap-1.5 justify-center pb-5">
            <div className={cn('h-1.5 w-6 rounded-full transition-colors', step === 1 ? 'bg-primary' : 'bg-border')} />
            <div className={cn('h-1.5 w-6 rounded-full transition-colors', step === 2 ? 'bg-primary' : 'bg-border')} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Login principal ──────────────────────────────────────────────────────────
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Bienvenido de nuevo');
      navigate('/');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex min-h-screen">
        {/* Panel izquierdo: identidad de marca */}
        <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-[#1a1a1a] px-12 relative overflow-hidden">
          <img
            src="/isotipo.svg"
            alt=""
            aria-hidden="true"
            className="absolute -bottom-16 -right-16 h-80 w-80 opacity-5 select-none pointer-events-none"
          />
          <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
            <img src="/logo-white.svg" alt="Canal Directo" className="h-12 w-auto mb-10" />
            <div className="w-12 h-0.5 bg-[#F7941D] mb-8 rounded-full" />
            <h1 className="text-2xl font-bold text-white leading-snug">
              Sistema de Gestión<br />de Vacaciones
            </h1>
            <p className="mt-4 text-sm text-white/50 leading-relaxed">
              Administrá solicitudes, calendarios de equipo y ciclos anuales de vacaciones de manera centralizada.
            </p>
          </div>
        </div>

        {/* Panel derecho: formulario */}
        <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
          <div className="w-full max-w-sm">
            {/* Logo para mobile */}
            <div className="mb-8 flex flex-col items-center lg:hidden">
              <img src="/logo.svg" alt="Canal Directo" className="h-10 w-auto" />
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground">Iniciar sesión</h2>
              <p className="mt-1 text-sm text-muted-foreground">Ingresá con tus credenciales corporativas</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.nombre@canaldirecto.com"
                required
              />

              {/* Contraseña con toggle de visibilidad */}
              <div>
                <label htmlFor="login-pwd" className="mb-1.5 block text-sm font-medium">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="login-pwd"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <Button type="submit" loading={loading} className="w-full">
                Ingresar
              </Button>
            </form>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Canal Directo. Uso interno.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de recuperación */}
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </>
  );
}
