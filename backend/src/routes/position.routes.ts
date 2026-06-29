import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as pos from '../controllers/position.controller';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(pos.list));
router.post('/', authorize(Role.ADMIN), validate(pos.positionSchema), asyncHandler(pos.create));
router.put('/:id', authorize(Role.ADMIN), validate(pos.positionSchema), asyncHandler(pos.update));
router.delete('/:id', authorize(Role.ADMIN), asyncHandler(pos.remove));

export default router;
