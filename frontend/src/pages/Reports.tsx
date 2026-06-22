import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { FileSpreadsheet, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { ReportData } from '@/types';
import { Button, Card, Spinner } from '@/components/ui';

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<'excel' | 'pdf' | null>(null);

  useEffect(() => {
    api
      .get<ReportData>('/reports')
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  async function download(type: 'excel' | 'pdf') {
    setDownloading(type);
    try {
      const res = await api.get(`/reports/${type}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'excel' ? 'reporte-vacaciones.xlsx' : 'reporte-vacaciones.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloading(null);
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
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">Análisis de vacaciones por empleado y sector</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" loading={downloading === 'excel'} onClick={() => download('excel')}>
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" loading={downloading === 'pdf'} onClick={() => download('pdf')}>
            <FileText className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {/* Gráfico por sector */}
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Días consumidos vs. disponibles por sector</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data?.byDepartment}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="department" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="used" name="Consumidos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="available" name="Disponibles" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tabla por empleado */}
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Por empleado</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="py-2 pr-2 font-medium">Empleado</th>
                  <th className="py-2 px-2 font-medium">Cons.</th>
                  <th className="py-2 px-2 font-medium">Pend.</th>
                  <th className="py-2 pl-2 font-medium">Disp.</th>
                </tr>
              </thead>
              <tbody>
                {data?.byEmployee.map((r) => (
                  <tr key={r.name} className="border-b border-border last:border-0">
                    <td className="py-2 pr-2">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.department}</div>
                    </td>
                    <td className="py-2 px-2">{r.used}</td>
                    <td className="py-2 px-2">{r.pending}</td>
                    <td className="py-2 pl-2 font-medium">{r.available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Tabla por sector */}
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Por sector</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="py-2 pr-2 font-medium">Sector</th>
                  <th className="py-2 px-2 font-medium">Empleados</th>
                  <th className="py-2 px-2 font-medium">Anuales</th>
                  <th className="py-2 px-2 font-medium">Cons.</th>
                  <th className="py-2 pl-2 font-medium">Disp.</th>
                </tr>
              </thead>
              <tbody>
                {data?.byDepartment.map((r) => (
                  <tr key={r.department} className="border-b border-border last:border-0">
                    <td className="py-2 pr-2 font-medium">{r.department}</td>
                    <td className="py-2 px-2">{r.employees}</td>
                    <td className="py-2 px-2">{r.annual}</td>
                    <td className="py-2 px-2">{r.used}</td>
                    <td className="py-2 pl-2 font-medium">{r.available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Download className="h-3.5 w-3.5" /> Exporta el reporte completo a Excel o PDF con los botones superiores.
      </p>
    </div>
  );
}
