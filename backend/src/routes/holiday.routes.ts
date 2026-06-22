import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as holiday from '../controllers/holiday.controller';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(holiday.list));
router.post('/', authorize(Role.ADMIN), validate(holiday.holidaySchema), asyncHandler(holiday.create));
router.put('/:id', authorize(Role.ADMIN), validate(holiday.holidaySchema), asyncHandler(holiday.update));
router.delete('/:id', authorize(Role.ADMIN), asyncHandler(holiday.remove));

export default router;
