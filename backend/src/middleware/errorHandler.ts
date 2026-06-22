import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: 'Endpoint no encontrado' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message, details: err.details });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Error de validación',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Ya existe un registro con ese valor único' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
  }

  console.error('❌ Error no controlado:', err);
  return res.status(500).json({ message: 'Error interno del servidor' });
}
