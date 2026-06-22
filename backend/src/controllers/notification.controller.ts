import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export async function list(req: Request, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.sub },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(notifications);
}

export async function markRead(req: Request, res: Response) {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.sub },
    data: { read: true },
  });
  res.json({ message: 'ok' });
}

export async function markAllRead(req: Request, res: Response) {
  await prisma.notification.updateMany({
    where: { userId: req.user!.sub, read: false },
    data: { read: true },
  });
  res.json({ message: 'ok' });
}
