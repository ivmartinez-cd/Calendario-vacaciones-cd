import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as settings from '../controllers/settings.controller';
import * as overlap from '../controllers/overlap.controller';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(settings.get));
router.put('/', authorize(Role.ADMIN), validate(settings.updateSettingsSchema), asyncHandler(settings.update));

// Exclusiones mutuas
router.get('/exclusions', authorize(Role.ADMIN), asyncHandler(overlap.listExclusions));
router.post('/exclusions', authorize(Role.ADMIN), validate(overlap.createExclusionSchema), asyncHandler(overlap.createExclusion));
router.delete('/exclusions/:id', authorize(Role.ADMIN), asyncHandler(overlap.deleteExclusion));

// Límites por cargo
router.get('/position-limits', authorize(Role.ADMIN), asyncHandler(overlap.listPositionLimits));
router.post('/position-limits', authorize(Role.ADMIN), validate(overlap.upsertPositionLimitSchema), asyncHandler(overlap.upsertPositionLimit));
router.delete('/position-limits/:id', authorize(Role.ADMIN), asyncHandler(overlap.deletePositionLimit));

export default router;
