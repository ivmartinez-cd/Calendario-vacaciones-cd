import { prisma } from '../config/prisma';

interface AuditInput {
  action: string;
  entity: string;
  entityId?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}

/** Registra una entrada de auditoría. Nunca lanza para no romper el flujo principal. */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        userId: input.userId ?? null,
        metadata: (input.metadata ?? undefined) as object | undefined,
      },
    });
  } catch (err) {
    console.error('Error registrando auditoría:', (err as Error).message);
  }
}
