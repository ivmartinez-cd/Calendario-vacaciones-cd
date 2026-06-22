import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { recordAudit } from '../services/audit.service';

export const holidaySchema = z.object({
  name: z.string().min(1),
  date: z.coerce.date(),
  deductsVacation: z.boolean().default(false),
});

interface ArgentinaDatosHoliday {
  fecha: string;
  tipo: string;
  nombre: string;
}

export async function list(_req: Request, res: Response) {
  const holidays = await prisma.holiday.findMany({ orderBy: { date: 'asc' } });
  res.json(holidays);
}

export async function create(req: Request, res: Response) {
  const data = req.body as z.infer<typeof holidaySchema>;
  const holiday = await prisma.holiday.create({ data });
  await recordAudit({ action: 'CREATE', entity: 'Holiday', entityId: holiday.id, userId: req.user!.sub, metadata: { name: holiday.name, date: holiday.date.toISOString().slice(0, 10) } });
  res.status(201).json(holiday);
}

export async function update(req: Request, res: Response) {
  const data = req.body as z.infer<typeof holidaySchema>;
  const holiday = await prisma.holiday.update({ where: { id: req.params.id }, data });
  await recordAudit({ action: 'UPDATE', entity: 'Holiday', entityId: holiday.id, userId: req.user!.sub, metadata: { name: holiday.name, date: holiday.date.toISOString().slice(0, 10) } });
  res.json(holiday);
}

export async function remove(req: Request, res: Response) {
  const exists = await prisma.holiday.findUnique({ where: { id: req.params.id } });
  if (!exists) throw ApiError.notFound('Feriado no encontrado');
  await prisma.holiday.delete({ where: { id: req.params.id } });
  await recordAudit({ action: 'DELETE', entity: 'Holiday', entityId: req.params.id, userId: req.user!.sub, metadata: { name: exists.name, date: exists.date.toISOString().slice(0, 10) } });
  res.status(204).send();
}

export async function exportAll(_req: Request, res: Response) {
  const holidays = await prisma.holiday.findMany({ orderBy: { date: 'asc' } });
  const backup = holidays.map((h) => ({
    name: h.name,
    date: h.date.toISOString(),
    deductsVacation: h.deductsVacation,
  }));
  res.setHeader('Content-Disposition', `attachment; filename="holidays-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(backup);
}

export async function importFromApi(req: Request, res: Response) {
  const targetYear = parseInt(req.params.year) || new Date().getFullYear();

  const response = await fetch(`https://api.argentinadatos.com/v1/feriados/${targetYear}`);
  if (!response.ok) {
    throw ApiError.badRequest(`No se pudieron obtener los feriados del año ${targetYear} desde la API externa`);
  }

  const externalHolidays = (await response.json()) as ArgentinaDatosHoliday[];
  let importedCount = 0;

  for (const item of externalHolidays) {
    const date = new Date(`${item.fecha}T00:00:00.000Z`);
    const deductsVacation = false;

    await prisma.holiday.upsert({
      where: { date },
      update: { name: item.nombre, deductsVacation },
      create: { name: item.nombre, date, deductsVacation },
    });
    importedCount++;
  }

  await recordAudit({
    action: 'IMPORT',
    entity: 'Holiday',
    entityId: null,
    userId: req.user!.sub,
    metadata: { year: targetYear, count: importedCount, source: 'api.argentinadatos.com' },
  });

  res.json({ message: `Se importaron/actualizaron ${importedCount} feriados para el año ${targetYear}`, count: importedCount });
}
