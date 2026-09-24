import { Router } from 'express';
import { OrderController } from '../controllers/orderController.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { quoteRequestSchema } from '../schemas/index.js';

const router = Router();

// Public: Customer submits quote request (no login required)
router.post('/quote-request', validate(quoteRequestSchema), OrderController.createQuoteRequest);

// Operations / Admin: View and search orders
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), OrderController.getOrders);
router.get('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), OrderController.getOrderDetail);

export default router;
