import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { prisma } from '../config/prisma';
import { getEmployeeBalance } from '../services/vacation.service';

interface EmployeeReportRow {
  name: string;
  department: string;
  position: string;
  annual: number;
  used: number;
  pending: number;
  available: number;
}

async function buildEmployeeReport(): Promise<EmployeeReportRow[]> {
  const employees = await prisma.employee.findMany({ include: { department: true }, orderBy: { firstName: 'asc' } });
  return Promise.all(
    employees.map(async (e) => {
      const b = await getEmployeeBalance(e.id);
      return {
        name: `${e.firstName} ${e.lastName}`,
        department: e.department.name,
        position: e.position,
        annual: b.annual,
        used: b.used,
        pending: b.pending,
        available: b.available,
      };
    }),
  );
}

interface DeptReportRow {
  department: string;
  employees: number;
  annual: number;
  used: number;
  available: number;
}

async function buildDepartmentReport(): Promise<DeptReportRow[]> {
  const departments = await prisma.department.findMany({ include: { employees: true }, orderBy: { name: 'asc' } });
  const rows: DeptReportRow[] = [];
  for (const d of departments) {
    let annual = 0;
    let used = 0;
    let available = 0;
    for (const e of d.employees) {
      const b = await getEmployeeBalance(e.id);
      annual += b.annual;
      used += b.used;
      available += b.available;
    }
    rows.push({ department: d.name, employees: d.employees.length, annual, used, available });
  }
  return rows;
}

/** JSON con ambos reportes (para mostrar en pantalla). */
export async function data(_req: Request, res: Response) {
  const [byEmployee, byDepartment] = await Promise.all([buildEmployeeReport(), buildDepartmentReport()]);
  res.json({ byEmployee, byDepartment });
}

/** Exporta a Excel (.xlsx). */
export async function excel(_req: Request, res: Response) {
  const [byEmployee, byDepartment] = await Promise.all([buildEmployeeReport(), buildDepartmentReport()]);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Canal Directo';
  wb.created = new Date();

  const ws1 = wb.addWorksheet('Por empleado');
  ws1.columns = [
    { header: 'Empleado', key: 'name', width: 28 },
    { header: 'Departamento', key: 'department', width: 20 },
    { header: 'Cargo', key: 'position', width: 24 },
    { header: 'Días anuales', key: 'annual', width: 14 },
    { header: 'Consumidos', key: 'used', width: 14 },
    { header: 'Pendientes', key: 'pending', width: 14 },
    { header: 'Disponibles', key: 'available', width: 14 },
  ];
  ws1.getRow(1).font = { bold: true };
  byEmployee.forEach((r) => ws1.addRow(r));

  const ws2 = wb.addWorksheet('Por departamento');
  ws2.columns = [
    { header: 'Departamento', key: 'department', width: 24 },
    { header: 'Empleados', key: 'employees', width: 14 },
    { header: 'Días anuales', key: 'annual', width: 14 },
    { header: 'Consumidos', key: 'used', width: 14 },
    { header: 'Disponibles', key: 'available', width: 14 },
  ];
  ws2.getRow(1).font = { bold: true };
  byDepartment.forEach((r) => ws2.addRow(r));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="reporte-vacaciones.xlsx"');
  await wb.xlsx.write(res);
  res.end();
}

/** Exporta a PDF. */
export async function pdf(_req: Request, res: Response) {
  const [byEmployee, byDepartment] = await Promise.all([buildEmployeeReport(), buildDepartmentReport()]);

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="reporte-vacaciones.pdf"');
  doc.pipe(res);

  doc.fontSize(20).fillColor('#1e293b').text('Reporte de Vacaciones', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#64748b').text(`Generado el ${new Date().toLocaleString('es-AR', { timeZone: 'America/Buenos_Aires' })}`, { align: 'center' });
  doc.moveDown(1.5);

  // --- Por empleado ---
  doc.fontSize(14).fillColor('#0f172a').text('Vacaciones por empleado');
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor('#334155');
  byEmployee.forEach((r) => {
    doc.text(
      `${r.name} — ${r.department} | Anuales: ${r.annual}  Consumidos: ${r.used}  Pendientes: ${r.pending}  Disponibles: ${r.available}`,
    );
  });

  doc.moveDown(1.2);
  doc.fontSize(14).fillColor('#0f172a').text('Vacaciones por departamento');
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor('#334155');
  byDepartment.forEach((r) => {
    doc.text(
      `${r.department} — Empleados: ${r.employees} | Anuales: ${r.annual}  Consumidos: ${r.used}  Disponibles: ${r.available}`,
    );
  });

  doc.end();
}
