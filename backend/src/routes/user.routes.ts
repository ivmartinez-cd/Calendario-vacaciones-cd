import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import * as usr from '../controllers/user.controller';

const router = Router();
router.use(authenticate);
router.use(requireAdmin);

router.get('/', asyncHandler(usr.list));
router.put('/:id/role', validate(usr.updateRoleSchema), asyncHandler(usr.updateRole));

export default router;
