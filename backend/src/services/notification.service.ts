import { prisma } from '../config/prisma';

/** Crea una notificación in-app para un usuario. */
export async function notifyUser(userId: string, title: string, body: string): Promise<void> {
  try {
    await prisma.notification.create({ data: { userId, title, body } });
  } catch (err) {
    console.error('Error creando notificación:', (err as Error).message);
  }
}
