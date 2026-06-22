import { useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

export default function AttendancePlaceholder() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-[#0b1329] text-slate-100">
      <header className="flex items-center gap-3 border-b border-slate-800 px-6 py-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/portal')} className="text-slate-400 hover:text-white hover:bg-slate-800">
          <ArrowLeft className="h-4 w-4 mr-1" /> Cambiar módulo
        </Button>
        <span className="text-sm font-medium text-slate-500">|</span>
        <span className="text-sm font-semibold">Registro de Asistencias</span>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10">
          <ClipboardList className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold">Módulo en desarrollo</h2>
        <p className="max-w-md text-center text-sm text-slate-400">
          El sistema de registro de asistencias se encuentra actualmente en desarrollo. Próximamente podrás gestionar horarios, horas extras y ausentismo desde este módulo.
        </p>
      </div>
    </div>
  );
}
