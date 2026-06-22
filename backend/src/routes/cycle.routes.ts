import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { openNextYearCycles, getBalanceForYear } from '../services/cycle.service';
import { prisma } from '../config/prisma';

const router = Router();

router.use(authenticate);

/**
 * GET /api/cycles?year=2026
 * Lista todos los ciclos de un año con saldo por empleado (solo admin).
 */
router.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const cycles = await prisma.vacationCycle.findMany({
      where: { year },
      include: { employee: { include: { department: true } } },
      orderBy: { employee: { firstName: 'asc' } },
    });

    const withBalance = await Promise.all(
      cycles.map(async (c) => ({
        ...c,
        balance: await getBalanceForYear(c.employeeId, year),
      })),
    );

    res.json(withBalance);
  }),
);

/**
 * POST /api/cycles/open-next-year
 * Fuerza la apertura del ciclo del año siguiente para todos los empleados activos (solo admin).
 */
router.post(
  '/open-next-year',
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const result = await openNextYearCycles();
    res.json({
      message: `Ciclo ${new Date().getFullYear() + 1} procesado`,
      ...result,
    });
  }),
);

/**
 * GET /api/cycles/employee/:id?year=2026
 * Devuelve el balance de un empleado para un año específico.
 */
router.get(
  '/employee/:id',
  asyncHandler(async (req, res) => {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const balance = await getBalanceForYear(req.params.id, year);
    res.json({ employeeId: req.params.id, year, ...balance });
  }),
);

export default router;
