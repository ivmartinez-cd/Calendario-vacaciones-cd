import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Department } from '@/types';
import { Button, Card, Input, Modal, Spinner } from '@/components/ui';

const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6', '#6366f1'];

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', color: PRESET_COLORS[0] });
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get<Department[]>('/departments');
    setDepartments(data);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', color: PRESET_COLORS[0] });
    setModalOpen(true);
  }

  function openEdit(d: Department) {
    setEditing(d);
    setForm({ name: d.name, color: d.color });
    setModalOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/departments/${editing.id}`, form);
      else await api.post('/departments', form);
      toast.success(editing ? 'Sector actualizado' : 'Sector creado');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(d: Department) {
    if (!confirm(`¿Eliminar el sector "${d.name}"?`)) return;
    try {
      await api.delete(`/departments/${d.id}`);
      toast.success('Sector eliminado');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (loading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sectores</h1>
          <p className="text-muted-foreground">Organiza la empresa y asigna colores al calendario</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nuevo sector
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((d) => (
          <Card key={d.id} className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-lg" style={{ background: d.color }} />
              <div>
                <p className="font-semibold">{d.name}</p>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> {d._count?.employees ?? 0} empleados
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(d)} className="rounded-md p-1.5 hover:bg-muted">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => remove(d)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar sector' : 'Nuevo sector'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button form="dept-form" type="submit" loading={saving}>
              Guardar
            </Button>
          </>
        }
      >
        <form id="dept-form" onSubmit={submit} className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div>
            <label className="text-sm font-medium">Color</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`h-8 w-8 rounded-lg transition ${form.color === c ? 'ring-2 ring-offset-2 ring-primary ring-offset-card' : ''}`}
                  style={{ background: c }}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded-lg border border-border bg-transparent"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
