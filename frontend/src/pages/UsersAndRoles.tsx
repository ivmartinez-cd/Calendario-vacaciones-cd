import { useEffect, useState } from 'react';
import { Save, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { UserWithRole, Department } from '@/types';
import { Button, Card, Spinner } from '@/components/ui';

export default function UsersAndRoles() {
  const [usersData, setUsersData] = useState<UserWithRole[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [savingUser, setSavingUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [{ data: u }, { data: d }] = await Promise.all([
        api.get<UserWithRole[]>('/users'),
        api.get<Department[]>('/departments'),
      ]);
      setUsersData(u);
      setDepartments(d);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateUserRole(userId: string, role: string, managedDepartmentId: string | null) {
    setSavingUser(userId);
    try {
      const { data } = await api.put<UserWithRole>(`/users/${userId}/role`, { role, managedDepartmentId });
      setUsersData((prev) =>
        prev.map((u) =>
          u.id === data.id
            ? { ...u, role: data.role, managedDepartmentId: data.managedDepartmentId, managedDepartmentName: data.managedDepartmentName }
            : u,
        ),
      );
      toast.success('Rol actualizado');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingUser(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuarios y Roles</h1>
          <p className="text-muted-foreground">
            Asigná rol y sector a cada usuario. Los <strong>Jefes de sector</strong> solo pueden ver y aprobar solicitudes de su sector asignado.
          </p>
        </div>
      </div>

      <Card className="p-6">
        {usersData.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                  <th className="pb-3 pr-4">Usuario</th>
                  <th className="pb-3 pr-4">Rol</th>
                  <th className="pb-3 pr-4">Sector a cargo</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usersData.map((u) => (
                  <UserRoleRow
                    key={u.id}
                    user={u}
                    departments={departments}
                    saving={savingUser === u.id}
                    onSave={(role, deptId) => updateUserRole(u.id, role, deptId)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Referencia de roles</p>
          <ul className="mt-2 space-y-1 text-xs text-blue-600 dark:text-blue-300">
            <li><strong>Administrador:</strong> acceso completo a todos los sectores, empleados y configuración.</li>
            <li><strong>Jefe de sector:</strong> solo ve y aprueba solicitudes del sector asignado. No puede aprobar la propia.</li>
            <li><strong>Empleado:</strong> solo gestiona sus propias solicitudes de vacaciones. El cargo que se muestra es el asignado en su perfil.</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

interface UserRoleRowProps {
  user: UserWithRole;
  departments: Department[];
  saving: boolean;
  onSave: (role: string, managedDepartmentId: string | null) => void;
}

function UserRoleRow({ user, departments, saving, onSave }: UserRoleRowProps) {
  const [role, setRole] = useState(user.role);
  const [deptId, setDeptId] = useState<string>(user.managedDepartmentId ?? '');
  const dirty = role !== user.role || (role === 'MANAGER' && deptId !== (user.managedDepartmentId ?? ''));

  function handleSave() {
    onSave(role, role === 'MANAGER' ? (deptId || null) : null);
  }

  const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Jefe de sector',
    EMPLOYEE: 'Empleado',
  };

  return (
    <tr className="group">
      <td className="py-3 pr-4">
        <p className="font-medium">{user.employeeName ?? '—'}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
        {user.employeePosition && <p className="text-xs text-muted-foreground">{user.employeePosition}</p>}
      </td>
      <td className="py-3 pr-4">
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value as typeof role);
            if (e.target.value !== 'MANAGER') setDeptId('');
          }}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary animate-none"
        >
          {(['ADMIN', 'MANAGER', 'EMPLOYEE'] as const).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </td>
      <td className="py-3 pr-4">
        {role === 'MANAGER' ? (
          <select
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">— seleccionar sector —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3">
        {dirty && (
          <Button size="sm" onClick={handleSave} loading={saving} disabled={role === 'MANAGER' && !deptId}>
            <Save className="h-3.5 w-3.5 animate-none" />
            Guardar
          </Button>
        )}
      </td>
    </tr>
  );
}
