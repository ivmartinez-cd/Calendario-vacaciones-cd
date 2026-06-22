import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as vac from '../controllers/vacation.controller';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(vac.list));
router.get('/calendar', asyncHandler(vac.calendar));
router.get('/:id', asyncHandler(vac.getById));
router.post('/', validate(vac.createRequestSchema), asyncHandler(vac.create));
router.put('/:id', validate(vac.updateRequestSchema), asyncHandler(vac.update));
router.get('/:id/overlaps', authorize(Role.ADMIN), asyncHandler(vac.overlaps));
router.post('/:id/decision', authorize(Role.ADMIN), validate(vac.decisionSchema), asyncHandler(vac.decide));
router.delete('/:id', asyncHandler(vac.remove));

export default router;
