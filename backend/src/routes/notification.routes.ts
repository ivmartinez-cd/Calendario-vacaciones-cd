import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as notif from '../controllers/notification.controller';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(notif.list));
router.patch('/read-all', asyncHandler(notif.markAllRead));
router.patch('/:id/read', asyncHandler(notif.markRead));

export default router;
