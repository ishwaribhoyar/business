import { Router } from 'express';
import { OrderController } from '../controllers/orderController.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import {
  quoteRequestSchema,
  orderStatusUpdateSchema,
  manualQuotationSchema,
  assignSupplierSchema,
  assignTruckSchema,
  assignDriverSchema,
  paymentCreateSchema,
  orderNoteCreateSchema,
} from '../schemas/index.js';

const router = Router();

// -----------------------------------------------------------------------------
// PUBLIC: Customer Quote Request Flow
// -----------------------------------------------------------------------------
router.post('/quote-request', validate(quoteRequestSchema), OrderController.createQuoteRequest);

// -----------------------------------------------------------------------------
// ADMIN / OPERATIONS: Protected Order Management Endpoints
// -----------------------------------------------------------------------------
const adminAuth = [authenticate, authorize('ADMIN', 'SUPER_ADMIN')];

// 1. List & Detail
router.get('/', ...adminAuth, OrderController.getOrders);
router.get('/:id', ...adminAuth, OrderController.getOrderDetail);

// 2. State Machine Transition
router.patch('/:id/status', ...adminAuth, validate(orderStatusUpdateSchema), OrderController.updateStatus);

// 3. Manual Quotation Snapshot Creation & Revision
router.post('/:id/quotations', ...adminAuth, validate(manualQuotationSchema), OrderController.createQuotation);

// 4. Fulfillment Assignment
router.post('/:id/supplier', ...adminAuth, validate(assignSupplierSchema), OrderController.assignSupplier);
router.post('/:id/truck', ...adminAuth, validate(assignTruckSchema), OrderController.assignTruck);
router.post('/:id/driver', ...adminAuth, validate(assignDriverSchema), OrderController.assignDriver);

// 5. Payment Recording
router.post('/:id/payments', ...adminAuth, validate(paymentCreateSchema), OrderController.recordPayment);

// 6. Operational Internal Notes
router.post('/:id/notes', ...adminAuth, validate(orderNoteCreateSchema), OrderController.addNote);

export default router;
