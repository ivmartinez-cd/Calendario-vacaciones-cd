import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Position } from '@/types';
import { Button, Card, Input, Modal, Spinner } from '@/components/ui';

export default function Positions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState({ name: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get<Position[]>('/positions');
    setPositions(data);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '' });
    setModalOpen(true);
  }

  function openEdit(p: Position) {
    setEditing(p);
    setForm({ name: p.name });
    setModalOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/positions/${editing.id}`, form);
      else await api.post('/positions', form);
      toast.success(editing ? 'Cargo actualizado' : 'Cargo creado');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Position) {
    if (!confirm(`¿Eliminar el cargo "${p.name}"?`)) return;
    try {
      await api.delete(`/positions/${p.id}`);
      toast.success('Cargo eliminado');
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
          <h1 className="text-2xl font-bold">Cargos</h1>
          <p className="text-muted-foreground">Administra los cargos y posiciones de la empresa</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nuevo cargo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {positions.map((p) => (
          <Card key={p.id} className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  {p._count?.employees ?? 0} empleados
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(p)} className="rounded-md p-1.5 hover:bg-muted">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => remove(p)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar cargo' : 'Nuevo cargo'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button form="position-form" type="submit" loading={saving}>
              Guardar
            </Button>
          </>
        }
      >
        <form id="position-form" onSubmit={submit} className="space-y-4">
          <Input label="Nombre del cargo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </form>
      </Modal>
    </div>
  );
}
