import { Router } from 'express';
import authRoutes from './auth.routes';
import departmentRoutes from './department.routes';
import employeeRoutes from './employee.routes';
import vacationRoutes from './vacation.routes';
import dashboardRoutes from './dashboard.routes';
import reportRoutes from './report.routes';
import notificationRoutes from './notification.routes';
import auditRoutes from './audit.routes';
import holidayRoutes from './holiday.routes';
import settingsRoutes from './settings.routes';
import cycleRoutes from './cycle.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/employees', employeeRoutes);
router.use('/vacations', vacationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);
router.use('/holidays', holidayRoutes);
router.use('/settings', settingsRoutes);
router.use('/cycles', cycleRoutes);

export default router;
