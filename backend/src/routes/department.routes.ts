import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as dept from '../controllers/department.controller';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(dept.list));
router.post('/', authorize(Role.ADMIN), validate(dept.departmentSchema), asyncHandler(dept.create));
router.put('/:id', authorize(Role.ADMIN), validate(dept.departmentSchema), asyncHandler(dept.update));
router.delete('/:id', authorize(Role.ADMIN), asyncHandler(dept.remove));

export default router;
