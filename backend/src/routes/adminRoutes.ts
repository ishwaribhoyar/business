import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

// Accessible to both ADMIN and SUPER_ADMIN
router.get('/dashboard/summary', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), AdminController.getDashboardSummary);

// Accessible strictly to SUPER_ADMIN
router.get('/settings', authenticate, authorize('SUPER_ADMIN'), AdminController.getSystemSettings);

export default router;
