import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { recordAudit } from '../services/audit.service';

const tierSchema = z.object({
  minYears: z.number().min(0),
  maxYears: z.number().min(0),
  days: z.number().int().min(1).max(365),
});

export const updateSettingsSchema = z.object({
  seniorityTiers: z.array(tierSchema).min(1).optional(),
  minAdvanceNoticeDays: z.number().int().min(0).max(365).optional(),
  maxOverlapPercent: z.number().int().min(0).max(100).optional(),
  maxOverlapCount: z.number().int().min(0).optional(),
  // Ciclos anuales
  nextYearOpenMonth: z.number().int().min(1).max(12).optional(),
  nextYearOpenDay: z.number().int().min(1).max(31).optional(),
  allowAdvanceRequest: z.boolean().optional(),
  maxAdvanceDays: z.number().int().min(0).optional(),
});

async function ensureConfig() {
  return prisma.systemConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });
}

export async function get(_req: Request, res: Response) {
  const config = await ensureConfig();
  res.json(config);
}

export async function update(req: Request, res: Response) {
  const data = req.body as z.infer<typeof updateSettingsSchema>;
  await ensureConfig();
  const config = await prisma.systemConfig.update({
    where: { id: 'singleton' },
    data: {
      ...(data.seniorityTiers !== undefined ? { seniorityTiers: data.seniorityTiers } : {}),
      ...(data.minAdvanceNoticeDays !== undefined ? { minAdvanceNoticeDays: data.minAdvanceNoticeDays } : {}),
      ...(data.maxOverlapPercent !== undefined ? { maxOverlapPercent: data.maxOverlapPercent } : {}),
      ...(data.maxOverlapCount !== undefined ? { maxOverlapCount: data.maxOverlapCount } : {}),
      ...(data.nextYearOpenMonth !== undefined ? { nextYearOpenMonth: data.nextYearOpenMonth } : {}),
      ...(data.nextYearOpenDay !== undefined ? { nextYearOpenDay: data.nextYearOpenDay } : {}),
      ...(data.allowAdvanceRequest !== undefined ? { allowAdvanceRequest: data.allowAdvanceRequest } : {}),
      ...(data.maxAdvanceDays !== undefined ? { maxAdvanceDays: data.maxAdvanceDays } : {}),
    },
  });
  await recordAudit({ action: 'UPDATE', entity: 'SystemConfig', entityId: 'singleton', userId: req.user!.sub, metadata: { changes: Object.keys(data) } });
  res.json(config);
}
