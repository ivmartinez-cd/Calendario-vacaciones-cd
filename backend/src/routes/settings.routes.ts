import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as settings from '../controllers/settings.controller';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(settings.get));
router.put('/', authorize(Role.ADMIN), validate(settings.updateSettingsSchema), asyncHandler(settings.update));

export default router;
