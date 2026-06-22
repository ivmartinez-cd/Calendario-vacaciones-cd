import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

/** Lista los registros de auditoría (sólo admin). */
export async function list(req: Request, res: Response) {
  const { entity, action, from, to } = req.query as Record<string, string | undefined>;
  const where: Record<string, unknown> = {};
  if (entity) where.entity = entity;
  if (action) where.action = action;
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, Date>).gte = new Date(from);
    if (to) (where.createdAt as Record<string, Date>).lte = new Date(to);
  }
  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  res.json(logs);
}
