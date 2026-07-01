import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as absence from '../controllers/absence.controller';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(absence.list));
router.get('/:id', asyncHandler(absence.getById));
router.post('/', validate(absence.createAbsenceSchema), asyncHandler(absence.create));
router.put('/:id', validate(absence.updateAbsenceSchema), asyncHandler(absence.update));
router.delete('/:id', asyncHandler(absence.remove));

export default router;
