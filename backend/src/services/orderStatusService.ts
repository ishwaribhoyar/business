import { OrderRepository } from '../repositories/orderRepository.js';
import { QuotationRepository } from '../repositories/quotationRepository.js';
import { AuditService } from '../services/auditService.js';
import { Order, OrderStatus, OrderStatusHistory } from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { dbAdapter } from '../db/dbAdapter.js';

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['CONTACTED', 'CANCELLED'],
  CONTACTED: ['QUOTATION_SENT', 'NEW', 'CANCELLED'],
  QUOTATION_SENT: ['CONFIRMED', 'CONTACTED', 'CANCELLED'],
  CONFIRMED: ['SUPPLIER_ASSIGNED', 'QUOTATION_SENT', 'CANCELLED'],
  SUPPLIER_ASSIGNED: ['TRUCK_ASSIGNED', 'CONFIRMED', 'CANCELLED'],
  TRUCK_ASSIGNED: ['LOADING', 'SUPPLIER_ASSIGNED', 'CANCELLED'],
  LOADING: ['OUT_FOR_DELIVERY', 'TRUCK_ASSIGNED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'LOADING', 'CANCELLED'],
  DELIVERED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export interface StatusTransitionContext {
  orderId: string;
  targetStatus: OrderStatus;
  cancellationReason?: string | null;
  notes?: string | null;
  userId: string;
  userName: string;
  ipAddress?: string;
}

export class OrderStatusService {
  private orderRepo: OrderRepository;
  private quotationRepo: QuotationRepository;
  private auditService: AuditService;

  constructor(
    orderRepo = new OrderRepository(),
    quotationRepo = new QuotationRepository(),
    auditService = new AuditService()
  ) {
    this.orderRepo = orderRepo;
    this.quotationRepo = quotationRepo;
    this.auditService = auditService;
  }

  async transitionStatus(context: StatusTransitionContext): Promise<{ order: Order; history: OrderStatusHistory }> {
    const { orderId, targetStatus, cancellationReason, notes, userId, userName, ipAddress } = context;

    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order with ID '${orderId}'`);
    }

    const currentStatus = order.status;

    // 1. Terminal state check
    if (currentStatus === 'COMPLETED') {
      throw new ValidationError('Cannot transition an order that is already in COMPLETED status.');
    }
    if (currentStatus === 'CANCELLED') {
      throw new ValidationError('Cannot transition an order that has already been CANCELLED.');
    }

    // 2. Validate transition against state machine
    const allowedTargets = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedTargets.includes(targetStatus)) {
      throw new ValidationError(
        `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Allowed next states: ${allowedTargets.join(
          ', '
        ) || 'None'}.`
      );
    }

    // 3. Validation for CANCELLATION
    if (targetStatus === 'CANCELLED') {
      if (!cancellationReason || cancellationReason.trim().length < 3) {
        throw new ValidationError('A cancellation reason must be provided (minimum 3 characters).');
      }
    }

    // 4. Invariants for Quotation States
    if (targetStatus === 'QUOTATION_SENT' || targetStatus === 'CONFIRMED') {
      const activeQuotes = await this.quotationRepo.findByOrderId(order.id);
      if (!order.current_quotation_id && activeQuotes.length === 0) {
        throw new ValidationError(
          `Cannot transition order to '${targetStatus}' without an issued delivered quotation. Please calculate and save a quotation first.`
        );
      }
    }

    // 5. Invariants for Logistics States (Strict: Supplier + Truck + Driver all required)
    if (targetStatus === 'LOADING' || targetStatus === 'OUT_FOR_DELIVERY') {
      if (!order.supplier_id) {
        throw new ValidationError(`Cannot transition order to '${targetStatus}' without an assigned supplier.`);
      }
      if (!order.truck_id) {
        throw new ValidationError(`Cannot transition order to '${targetStatus}' without an assigned delivery truck.`);
      }
      if (!order.driver_id) {
        throw new ValidationError(`Cannot transition order to '${targetStatus}' without an assigned driver.`);
      }
    }

    // 6. Execute transition atomically
    const now = new Date().toISOString();

    return dbAdapter.transaction(async () => {
      await this.orderRepo.updateStatus(order.id, targetStatus, cancellationReason ?? null);

      const historyId = `osh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const historyRecord: OrderStatusHistory = {
        id: historyId,
        order_id: order.id,
        previous_status: currentStatus,
        new_status: targetStatus,
        changed_by_user_id: userId,
        notes: notes || (targetStatus === 'CANCELLED' ? `Reason: ${cancellationReason}` : null),
        created_at: now,
      };
      await this.orderRepo.recordStatusHistory(historyRecord);

      await this.auditService.recordAction({
        userId,
        action: targetStatus === 'CANCELLED' ? 'ORDER_CANCELLED' : 'ORDER_STATUS_CHANGED',
        entityType: 'ORDER',
        entityId: order.id,
        changes: {
          from: currentStatus,
          to: targetStatus,
          cancellationReason: cancellationReason ?? null,
          changedBy: userName,
        },
        ipAddress,
      });

      const updatedOrder = (await this.orderRepo.findById(order.id))!;
      return { order: updatedOrder, history: historyRecord };
    });
  }
}
