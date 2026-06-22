import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as emp from '../controllers/employee.controller';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(emp.list));
router.get('/:id', asyncHandler(emp.getById));
router.get('/:id/vacations', asyncHandler(emp.getVacations));
router.post('/', authorize(Role.ADMIN), validate(emp.createEmployeeSchema), asyncHandler(emp.create));
router.put('/:id', authorize(Role.ADMIN), validate(emp.updateEmployeeSchema), asyncHandler(emp.update));
router.delete('/:id', authorize(Role.ADMIN), asyncHandler(emp.remove));

export default router;
