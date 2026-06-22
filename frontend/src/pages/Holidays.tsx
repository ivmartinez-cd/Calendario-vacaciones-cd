import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Download, CloudDownload } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Holiday } from '@/types';
import { Button, Card, Input, Modal, Spinner, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface FormState {
  name: string;
  date: string;
  deductsVacation: boolean;
}

const emptyForm: FormState = { name: '', date: '', deductsVacation: false };

export default function Holidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importYear, setImportYear] = useState(new Date().getFullYear());

  async function load() {
    const { data } = await api.get<Holiday[]>('/holidays');
    setHolidays(data);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(h: Holiday) {
    setEditing(h);
    setForm({ name: h.name, date: h.date.slice(0, 10), deductsVacation: h.deductsVacation });
    setModalOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/holidays/${editing.id}`, form);
        toast.success('Feriado actualizado');
      } else {
        await api.post('/holidays', form);
        toast.success('Feriado creado');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(h: Holiday) {
    if (!confirm(`¿Eliminar "${h.name}"?`)) return;
    try {
      await api.delete(`/holidays/${h.id}`);
      toast.success('Feriado eliminado');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function importFromApi() {
    if (!confirm(`¿Importar feriados de Argentina para el año ${importYear} desde la API pública? Los feriados existentes en las mismas fechas se actualizarán.`)) return;
    setImporting(true);
    try {
      const { data } = await api.post<{ message: string; count: number }>(`/holidays/import/${importYear}`);
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setImporting(false);
    }
  }

  async function exportBackup() {
    try {
      const { data } = await api.get('/holidays/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `holidays-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup descargado');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Feriados</h1>
          <p className="text-muted-foreground">Gestiona los feriados y días no laborables</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={exportBackup}>
            <Download className="h-4 w-4" /> Exportar backup
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nuevo feriado
          </Button>
        </div>
      </div>

      {/* Importar desde API */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
              <CloudDownload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Importar feriados de Argentina</h2>
              <p className="text-xs text-muted-foreground">Carga automática desde api.argentinadatos.com</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Input
              type="number"
              min={2020}
              max={2050}
              value={importYear}
              onChange={(e) => setImportYear(parseInt(e.target.value) || new Date().getFullYear())}
              className="w-24"
            />
            <Button onClick={importFromApi} loading={importing}>
              <CloudDownload className="h-4 w-4" /> Importar {importYear}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner />
          </div>
        ) : holidays.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No hay feriados cargados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Día</th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Descuenta vacaciones</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {holidays.map((h) => (
                  <tr key={h.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3">{formatDate(h.date)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(h.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long' }).replace(/^\w/, c => c.toUpperCase())}
                    </td>
                    <td className="px-4 py-3 font-medium">{h.name}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          h.deductsVacation
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                        }
                      >
                        {h.deductsVacation ? 'Sí' : 'No'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(h)} className="rounded-md p-1.5 hover:bg-muted">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => remove(h)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar feriado' : 'Nuevo feriado'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button form="holiday-form" type="submit" loading={saving}>
              {editing ? 'Guardar cambios' : 'Crear feriado'}
            </Button>
          </>
        }
      >
        <form id="holiday-form" onSubmit={submit} className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Fecha" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <div className="rounded-lg border border-border p-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.deductsVacation}
                onChange={(e) => setForm({ ...form, deductsVacation: e.target.checked })}
              />
              Descuenta días de vacaciones
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              Si está activo, el feriado se cuenta como día laboral y se descuenta del saldo de vacaciones del empleado.
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
}
