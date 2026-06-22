import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as report from '../controllers/report.controller';

const router = Router();
router.use(authenticate, authorize(Role.ADMIN));

router.get('/', asyncHandler(report.data));
router.get('/excel', asyncHandler(report.excel));
router.get('/pdf', asyncHandler(report.pdf));

export default router;
