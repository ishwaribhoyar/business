import { PaymentRepository } from '../repositories/paymentRepository.js';
import { OrderRepository } from '../repositories/orderRepository.js';
import { QuotationRepository } from '../repositories/quotationRepository.js';
import { AuditService } from '../services/auditService.js';
import { Payment, PaymentStatus, Order } from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { dbAdapter } from '../db/dbAdapter.js';

export interface RecordPaymentInputs {
  order_id: string;
  amount: number;
  payment_method: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  payment_status?: PaymentStatus;
  transaction_reference?: string | null;
  notes?: string | null;
  payment_date?: string;
  user_id: string;
  user_name: string;
  ip_address?: string;
}

export class PaymentService {
  private paymentRepo: PaymentRepository;
  private orderRepo: OrderRepository;
  private quotationRepo: QuotationRepository;
  private auditService: AuditService;

  constructor(
    paymentRepo = new PaymentRepository(),
    orderRepo = new OrderRepository(),
    quotationRepo = new QuotationRepository(),
    auditService = new AuditService()
  ) {
    this.paymentRepo = paymentRepo;
    this.orderRepo = orderRepo;
    this.quotationRepo = quotationRepo;
    this.auditService = auditService;
  }

  async recordPayment(inputs: RecordPaymentInputs): Promise<{ payment: Payment; order: Order; totalPaid: number; balanceDue: number }> {
    const order = await this.orderRepo.findById(inputs.order_id);
    if (!order) {
      throw new NotFoundError(`Order with ID '${inputs.order_id}'`);
    }

    if (order.status === 'CANCELLED') {
      throw new ValidationError('Cannot record payments for a CANCELLED order.');
    }

    const amount = Number(inputs.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new ValidationError('Payment amount must be greater than zero.');
    }

    const validMethods = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'];
    if (!validMethods.includes(inputs.payment_method)) {
      throw new ValidationError(`Payment method must be one of: ${validMethods.join(', ')}.`);
    }

    // Get order customer price from active quotation
    let finalCustomerPrice = 0;
    if (order.current_quotation_id) {
      const quote = await this.quotationRepo.findById(order.current_quotation_id);
      if (quote) {
        finalCustomerPrice = quote.final_delivered_price;
      }
    }

    const currentTotalPaid = await this.paymentRepo.getTotalPaidForOrder(order.id);
    const newTotalPaid = currentTotalPaid + amount;

    // Enforce overpayment rule: paid amount cannot exceed final customer price if a quote has been issued
    if (finalCustomerPrice > 0 && newTotalPaid > finalCustomerPrice) {
      throw new ValidationError(
        `Payment amount of ₹${amount} exceeds outstanding balance of ₹${finalCustomerPrice - currentTotalPaid} (Quoted total: ₹${finalCustomerPrice}, Already paid: ₹${currentTotalPaid}).`
      );
    }

    // Determine derived payment status
    let derivedStatus: PaymentStatus = 'Partially Paid';
    if (finalCustomerPrice > 0) {
      if (newTotalPaid >= finalCustomerPrice) {
        derivedStatus = 'Paid';
      } else {
        derivedStatus = 'Partially Paid';
      }
    } else {
      derivedStatus = 'Partially Paid';
    }

    // Explicit status override if Refunded
    const paymentStatusToRecord = inputs.payment_status === 'Refunded' ? 'Refunded' : derivedStatus;

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const paymentDate = inputs.payment_date || now.split('T')[0];

    const payment: Payment = {
      id: paymentId,
      order_id: order.id,
      amount,
      payment_method: inputs.payment_method,
      payment_status: paymentStatusToRecord,
      transaction_reference: inputs.transaction_reference ?? null,
      notes: inputs.notes ?? null,
      recorded_by_user_id: inputs.user_id,
      payment_date: paymentDate,
      created_at: now,
    };

    return dbAdapter.transaction(async () => {
      await this.paymentRepo.create(payment);
      await this.orderRepo.updatePaymentStatus(order.id, derivedStatus);

      await this.auditService.recordAction({
        userId: inputs.user_id,
        action: 'PAYMENT_RECORDED',
        entityType: 'PAYMENT',
        entityId: payment.id,
        changes: {
          orderId: order.id,
          amount,
          paymentMethod: inputs.payment_method,
          paymentStatus: derivedStatus,
          totalPaid: newTotalPaid,
          recordedBy: inputs.user_name,
        },
        ipAddress: inputs.ip_address,
      });

      const updatedOrder = (await this.orderRepo.findById(order.id))!;
      const balanceDue = Math.max(0, finalCustomerPrice - newTotalPaid);

      return {
        payment,
        order: updatedOrder,
        totalPaid: newTotalPaid,
        balanceDue,
      };
    });
  }

  async getOrderPaymentSummary(orderId: string): Promise<{
    payments: Payment[];
    totalPaid: number;
    finalCustomerPrice: number;
    balanceDue: number;
    paymentStatus: PaymentStatus;
  }> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order '${orderId}'`);
    }

    const payments = await this.paymentRepo.findByOrderId(orderId);
    const totalPaid = await this.paymentRepo.getTotalPaidForOrder(orderId);

    let finalCustomerPrice = 0;
    if (order.current_quotation_id) {
      const quote = await this.quotationRepo.findById(order.current_quotation_id);
      if (quote) {
        finalCustomerPrice = quote.final_delivered_price;
      }
    }

    const balanceDue = Math.max(0, finalCustomerPrice - totalPaid);

    return {
      payments,
      totalPaid,
      finalCustomerPrice,
      balanceDue,
      paymentStatus: order.payment_status,
    };
  }
}
