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
