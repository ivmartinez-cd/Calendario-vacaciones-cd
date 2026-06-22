import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as dashboard from '../controllers/dashboard.controller';

const router = Router();
router.use(authenticate);
router.get('/summary', asyncHandler(dashboard.summary));

export default router;
