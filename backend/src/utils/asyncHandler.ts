import { Request, Response, NextFunction, RequestHandler } from 'express';

/** Envuelve un handler async y reenvía los errores al middleware de errores. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
