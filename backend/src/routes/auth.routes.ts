import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as auth from '../controllers/auth.controller';

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true });

router.post('/login', authLimiter, validate(auth.loginSchema), asyncHandler(auth.login));
router.post('/refresh', validate(auth.refreshSchema), asyncHandler(auth.refresh));
router.post('/forgot-password', authLimiter, validate(auth.forgotSchema), asyncHandler(auth.forgotPassword));
router.post('/reset-password', authLimiter, validate(auth.resetSchema), asyncHandler(auth.resetPassword));
router.post('/direct-reset', authLimiter, validate(auth.directResetSchema), asyncHandler(auth.directReset));
router.get('/me', authenticate, asyncHandler(auth.me));

export default router;
