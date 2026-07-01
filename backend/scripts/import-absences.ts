/**
 * Importa la data histórica de bajas del Excel "Descuento de Dias Operaciones.xlsx"
 * (hoja "Seguimiento bajas empleados") hacia la tabla Absence.
 *
 * Las filas de tipo "Vacaciones" se omiten a propósito: las vacaciones ya se
 * gestionan en VacationRequest y no queremos duplicar/afectar balances reales.
 *
 * Uso:
 *   tsx scripts/import-absences.ts --dry-run   (default, no escribe nada)
 *   tsx scripts/import-absences.ts --apply     (aplica los cambios)
 *
 * Ruta del Excel configurable con --file=<ruta> (default: ver EXCEL_PATH abajo).
 */
import path from 'path';
import ExcelJS from 'exceljs';
import { PrismaClient, AbsenceType, EmployeeStatus } from '@prisma/client';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const fileArg = args.find((a) => a.startsWith('--file='));
const EXCEL_PATH = fileArg
  ? fileArg.slice('--file='.length)
  : path.resolve(__dirname, '../../Descuento de Dias Operaciones.xlsx');

const SHEET_NAME = 'Seguimiento bajas empleados';
const HEADER_ROW = 3; // fila de encabezados en el Excel (1-indexed)
const COL = { nombre: 2, inicio: 3, fin: 4, tipo: 6, dias: 7, observaciones: 8 };

const TYPE_MAP: Record<string, AbsenceType> = {
  'descuento dia': AbsenceType.DESCUENTO_DIA,
  'baja por enfermedad': AbsenceType.BAJA_ENFERMEDAD,
  'tramites personales': AbsenceType.TRAMITE_PERSONAL,
  guardia: AbsenceType.GUARDIA,
  'dia de estudio': AbsenceType.DIA_ESTUDIO,
};

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function toTitleCase(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}

// Alias manuales para variantes/typos detectados durante el análisis del Excel.
const NAME_ALIASES: Record<string, { first: string; last: string }> = {
  [normalize('Federico Tabarez')]: { first: 'Federico', last: 'Tabarez' },
  [normalize('Marcia Pollero')]: { first: 'Marcia', last: 'Pollero' },
  [normalize('Pablo Varverde')]: { first: 'Pablo', last: 'Valverde' },
  [normalize('Segalof, Iair')]: { first: 'Iair', last: 'Segaloff' },
  [normalize('Segaloff, Iair')]: { first: 'Iair', last: 'Segaloff' },
  // "Milan, Matias" en el Excel es la misma persona que el Employee activo
  // guardado como firstName="Milan", lastName="Matias" (nombre/apellido
  // invertidos respecto a la convención "Apellido, Nombre" del Excel).
  [normalize('Milan, Matias')]: { first: 'Milan', last: 'Matias' },
};

function parseName(raw: string): { first: string; last: string } | null {
  const norm = normalize(raw);
  if (NAME_ALIASES[norm]) return NAME_ALIASES[norm];
  if (!raw.includes(',')) return null; // no debería pasar salvo los alias de arriba
  const [lastPart, ...rest] = raw.split(',');
  const firstPart = rest.join(',');
  if (!lastPart.trim() || !firstPart.trim()) return null;
  return { first: toTitleCase(firstPart), last: toTitleCase(lastPart) };
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    // Serial de fecha de Excel (base 1899-12-30)
    return new Date(Date.UTC(1899, 11, 30) + value * 86400000);
  }
  return null;
}

function calendarDaysInclusive(start: Date, end: Date): number {
  const a = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const b = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.round((b - a) / 86400000) + 1;
}

interface ParsedRow {
  rawName: string;
  first: string;
  last: string;
  matchKey: string; // normalize("last, first")
  type: AbsenceType;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string | null;
  excelRow: number;
}

async function main() {
  console.log(`Leyendo "${EXCEL_PATH}" (${APPLY ? 'APPLY' : 'DRY-RUN'})`);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH);
  const sheet = wb.getWorksheet(SHEET_NAME);
  if (!sheet) throw new Error(`No se encontró la hoja "${SHEET_NAME}"`);

  const parsed: ParsedRow[] = [];
  const warnings: string[] = [];
  let skippedVacaciones = 0;
  let skippedBlank = 0;
  let swappedDates = 0;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= HEADER_ROW) return;

    const rawName = row.getCell(COL.nombre).value;
    const nombreStr = rawName ? String(rawName).trim() : '';
    if (!nombreStr) {
      skippedBlank++;
      return;
    }

    const tipoRaw = row.getCell(COL.tipo).value;
    const tipoStr = tipoRaw ? String(tipoRaw).trim() : '';
    if (normalize(tipoStr) === 'vacaciones') {
      skippedVacaciones++;
      return;
    }

    const type = TYPE_MAP[normalize(tipoStr)];
    if (!type) {
      warnings.push(`Fila ${rowNumber}: tipo de baja desconocido "${tipoStr}" para "${nombreStr}" — omitida`);
      return;
    }

    let start = toDate(row.getCell(COL.inicio).value);
    let end = toDate(row.getCell(COL.fin).value);
    if (!start || !end) {
      warnings.push(`Fila ${rowNumber}: fechas inválidas para "${nombreStr}" — omitida`);
      return;
    }
    if (start > end) {
      [start, end] = [end, start];
      swappedDates++;
      warnings.push(`Fila ${rowNumber}: fecha de inicio posterior a la de fin para "${nombreStr}" — se intercambiaron`);
    }

    const diasCell = row.getCell(COL.dias).value;
    const days = typeof diasCell === 'number' && diasCell > 0 ? diasCell : calendarDaysInclusive(start, end);

    const name = parseName(nombreStr);
    if (!name) {
      warnings.push(`Fila ${rowNumber}: no se pudo interpretar el nombre "${nombreStr}" — omitida`);
      return;
    }

    const obsCell = row.getCell(COL.observaciones).value;
    const reason = obsCell ? String(obsCell).trim() || null : null;

    parsed.push({
      rawName: nombreStr,
      first: name.first,
      last: name.last,
      matchKey: normalize(`${name.last}, ${name.first}`),
      type,
      startDate: start,
      endDate: end,
      days,
      reason,
      excelRow: rowNumber,
    });
  });

  // ── Matching contra empleados actuales ──────────────────────────────────
  const employees = await prisma.employee.findMany({ select: { id: true, firstName: true, lastName: true } });
  const dbEmployees = employees.map((e) => ({
    id: e.id,
    lastNorm: normalize(e.lastName),
    firstNorm: normalize(e.firstName),
    firstTokens: normalize(e.firstName).split(' ').filter(Boolean),
  }));

  function findEmployeeId(lastNorm: string, firstNorm: string): string | null {
    const exact = dbEmployees.find((e) => e.lastNorm === lastNorm && e.firstNorm === firstNorm);
    if (exact) return exact.id;
    const sameLast = dbEmployees.filter((e) => e.lastNorm === lastNorm);
    if (sameLast.length === 1) {
      const dbTokens = sameLast[0].firstTokens;
      const exTokens = firstNorm.split(' ').filter(Boolean);
      const overlap = exTokens.every((t) => dbTokens.includes(t)) || dbTokens.every((t) => exTokens.includes(t));
      if (overlap) return sameLast[0].id;
    }
    return null;
  }

  interface StubInfo {
    first: string;
    last: string;
    earliestDate: Date;
    rowCount: number;
  }
  const matchedIdByKey = new Map<string, string>();
  const stubsNeeded = new Map<string, StubInfo>();

  for (const row of parsed) {
    if (matchedIdByKey.has(row.matchKey) || stubsNeeded.has(row.matchKey)) {
      const stub = stubsNeeded.get(row.matchKey);
      if (stub) {
        stub.rowCount++;
        if (row.startDate < stub.earliestDate) stub.earliestDate = row.startDate;
      }
      continue;
    }
    const id = findEmployeeId(normalize(row.last), normalize(row.first));
    if (id) {
      matchedIdByKey.set(row.matchKey, id);
    } else {
      stubsNeeded.set(row.matchKey, { first: row.first, last: row.last, earliestDate: row.startDate, rowCount: 1 });
    }
  }

  // ── Reporte ──────────────────────────────────────────────────────────────
  const byType = new Map<AbsenceType, number>();
  for (const row of parsed) byType.set(row.type, (byType.get(row.type) ?? 0) + 1);

  console.log('\n── Resumen ──');
  console.log(`Filas totales procesadas: ${parsed.length}`);
  console.log(`Filas "Vacaciones" omitidas (no importadas): ${skippedVacaciones}`);
  console.log(`Filas en blanco omitidas: ${skippedBlank}`);
  console.log(`Fechas invertidas corregidas: ${swappedDates}`);
  console.log('\nPor tipo:');
  for (const [type, count] of byType) console.log(`  ${type}: ${count}`);
  console.log(`\nEmpleados actuales matcheados: ${matchedIdByKey.size}`);
  console.log(`Empleados NO encontrados (se creará stub INACTIVE):`);
  for (const [key, s] of stubsNeeded) {
    console.log(`  - ${s.last}, ${s.first} (${s.rowCount} filas, primera fecha ${s.earliestDate.toISOString().slice(0, 10)}) [key: ${key}]`);
  }
  if (warnings.length) {
    console.log(`\nAdvertencias (${warnings.length}):`);
    warnings.forEach((w) => console.log(`  ! ${w}`));
  }

  if (!APPLY) {
    console.log('\nDRY-RUN: no se escribió nada en la base. Ejecutá con --apply para aplicar los cambios.');
    return;
  }

  // ── Aplicar ──────────────────────────────────────────────────────────────
  console.log('\nAplicando cambios...');

  const department = await prisma.department.upsert({
    where: { name: 'Ex-Empleados' },
    update: {},
    create: { name: 'Ex-Empleados' },
  });
  const position = await prisma.position.upsert({
    where: { name: 'Sin cargo' },
    update: {},
    create: { name: 'Sin cargo' },
  });

  const usedEmails = new Set<string>();
  for (const [key, s] of stubsNeeded) {
    let slug = normalize(`${s.first}.${s.last}`).replace(/[^a-z0-9.]/g, '');
    let email = `${slug}@ex-empleado.local`;
    let suffix = 1;
    while (usedEmails.has(email)) {
      email = `${slug}${suffix}@ex-empleado.local`;
      suffix++;
    }
    usedEmails.add(email);

    const created = await prisma.employee.create({
      data: {
        firstName: s.first,
        lastName: s.last,
        email,
        hireDate: s.earliestDate,
        status: EmployeeStatus.INACTIVE,
        departmentId: department.id,
        positionId: position.id,
      },
    });
    matchedIdByKey.set(key, created.id);
    console.log(`  + Empleado creado: ${s.last}, ${s.first} -> ${created.id}`);
  }

  let inserted = 0;
  let failed = 0;
  for (const row of parsed) {
    const employeeId = matchedIdByKey.get(row.matchKey);
    if (!employeeId) {
      console.error(`  ! Fila ${row.excelRow}: sin employeeId resuelto para "${row.rawName}" — omitida`);
      failed++;
      continue;
    }
    try {
      await prisma.absence.create({
        data: {
          employeeId,
          startDate: row.startDate,
          endDate: row.endDate,
          daysCount: row.days,
          type: row.type,
          reason: row.reason,
          status: 'APPROVED',
        },
      });
      inserted++;
    } catch (err) {
      failed++;
      console.error(`  ! Fila ${row.excelRow}: error insertando baja de "${row.rawName}": ${(err as Error).message}`);
    }
  }

  console.log(`\nListo. Bajas insertadas: ${inserted}. Fallidas: ${failed}. Empleados stub creados: ${stubsNeeded.size}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
