import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as audit from '../controllers/audit.controller';

const router = Router();
router.use(authenticate, authorize(Role.ADMIN));
router.get('/', asyncHandler(audit.list));

export default router;
