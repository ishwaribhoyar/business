import { Router } from 'express';
import { HealthController } from '../controllers/healthController.js';

const router = Router();

router.get('/', HealthController.getHealth);
router.get('/readiness', HealthController.getReadiness);

export default router;
