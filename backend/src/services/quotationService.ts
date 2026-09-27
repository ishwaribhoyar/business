import { QuotationRepository } from '../repositories/quotationRepository.js';
import { OrderRepository } from '../repositories/orderRepository.js';
import { AuditService } from '../services/auditService.js';
import { Quotation, Order } from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { getDatabase } from '../db/connection.js';

export interface QuotationCalculationInputs {
  material_cost: number;
  transport_cost: number;
  loading_cost?: number;
  platform_fee?: number;
  discount?: number;
}

export interface QuotationCalculationResult {
  base_cost: number;
  material_cost: number;
  transport_cost: number;
  loading_cost: number;
  platform_fee: number;
  discount: number;
  final_delivered_price: number;
  estimated_gross_margin: number;
  gross_margin_percentage: number;
}

export interface CreateQuotationContext extends QuotationCalculationInputs {
  order_id: string;
  validity_date: string;
  notes?: string | null;
  user_id: string;
  user_name: string;
  ip_address?: string;
  advance_order_status?: boolean; // If true, transition order to QUOTATION_SENT
}

export class QuotationService {
  private quotationRepo: QuotationRepository;
  private orderRepo: OrderRepository;
  private auditService: AuditService;

  constructor(
    quotationRepo = new QuotationRepository(),
    orderRepo = new OrderRepository(),
    auditService = new AuditService()
  ) {
    this.quotationRepo = quotationRepo;
    this.orderRepo = orderRepo;
    this.auditService = auditService;
  }

  calculateQuotation(inputs: QuotationCalculationInputs): QuotationCalculationResult {
    const materialCost = Number(inputs.material_cost);
    const transportCost = Number(inputs.transport_cost);
    const loadingCost = Number(inputs.loading_cost ?? 0);
    const platformFee = Number(inputs.platform_fee ?? 0);
    const discount = Number(inputs.discount ?? 0);

    // Validation against negative monetary inputs
    if (isNaN(materialCost) || materialCost < 0) {
      throw new ValidationError('Material cost must be a non-negative number.');
    }
    if (isNaN(transportCost) || transportCost < 0) {
      throw new ValidationError('Transport cost must be a non-negative number.');
    }
    if (isNaN(loadingCost) || loadingCost < 0) {
      throw new ValidationError('Loading/direct cost must be a non-negative number.');
    }
    if (isNaN(platformFee) || platformFee < 0) {
      throw new ValidationError('Platform margin/fee must be a non-negative number.');
    }
    if (isNaN(discount) || discount < 0) {
      throw new ValidationError('Discount must be a non-negative number.');
    }

    const baseCost = materialCost + transportCost + loadingCost;
    const finalDeliveredPrice = baseCost + platformFee - discount;

    if (finalDeliveredPrice < 0) {
      throw new ValidationError(
        `Final customer price cannot be negative. Discount (₹${discount}) exceeds gross price (₹${baseCost + platformFee}).`
      );
    }

    const estimatedGrossMargin = finalDeliveredPrice - baseCost;
    const grossMarginPercentage =
      finalDeliveredPrice > 0 ? (estimatedGrossMargin / finalDeliveredPrice) * 100 : 0;

    return {
      base_cost: baseCost,
      material_cost: materialCost,
      transport_cost: transportCost,
      loading_cost: loadingCost,
      platform_fee: platformFee,
      discount,
      final_delivered_price: finalDeliveredPrice,
      estimated_gross_margin: estimatedGrossMargin,
      gross_margin_percentage: Math.round(grossMarginPercentage * 100) / 100,
    };
  }

  createQuotationSnapshot(context: CreateQuotationContext): { quotation: Quotation; order: Order } {
    const order = this.orderRepo.findById(context.order_id);
    if (!order) {
      throw new NotFoundError(`Order with ID '${context.order_id}'`);
    }

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new ValidationError(`Cannot issue quotations for orders in '${order.status}' status.`);
    }

    // Authoritative server-side recalculation (never trust client arithmetic)
    const calculation = this.calculateQuotation(context);

    // Optional internal validity date (default to 3 days from now if not explicitly provided)
    const validityDate =
      context.validity_date && context.validity_date.trim().length > 0
        ? context.validity_date
        : new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

    const latestVersion = this.quotationRepo.getLatestVersion(order.id);
    const newVersion = latestVersion + 1;
    const isRevision = latestVersion > 0;

    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const quotationRef = `QUO-${dateStr}-${randSuffix}-v${newVersion}`;
    const now = new Date().toISOString();
    const quoteId = `quo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newQuotation: Quotation = {
      id: quoteId,
      quotation_reference: quotationRef,
      order_id: order.id,
      version: newVersion,
      quotation_status: 'ISSUED',
      material_cost: calculation.material_cost,
      transport_cost: calculation.transport_cost,
      loading_cost: calculation.loading_cost,
      platform_fee: calculation.platform_fee,
      discount: calculation.discount,
      final_delivered_price: calculation.final_delivered_price,
      estimated_gross_margin: calculation.estimated_gross_margin,
      validity_date: validityDate,
      notes: context.notes ?? null,
      created_by_user_id: context.user_id,
      created_at: now,
    };

    const db = getDatabase();
    db.exec('BEGIN IMMEDIATE;');
    try {
      // 1. Mark previous active quotations as SUPERSEDED (preserving historical snapshot records)
      if (isRevision) {
        this.quotationRepo.markPreviousQuotationsSuperseded(order.id);
      }

      // 2. Persist new immutable quotation snapshot
      this.quotationRepo.create(newQuotation);

      // 3. Update order current quotation pointer
      this.orderRepo.updateCurrentQuotation(order.id, newQuotation.id);

      // 4. Optionally advance status if order is in NEW or CONTACTED
      if (context.advance_order_status && (order.status === 'NEW' || order.status === 'CONTACTED')) {
        this.orderRepo.updateStatus(order.id, 'QUOTATION_SENT');
        const historyId = `osh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        this.orderRepo.recordStatusHistory({
          id: historyId,
          order_id: order.id,
          previous_status: order.status,
          new_status: 'QUOTATION_SENT',
          changed_by_user_id: context.user_id,
          notes: `Quotation ${quotationRef} issued to customer (Delivered Price: ₹${calculation.final_delivered_price})`,
          created_at: now,
        });
      }

      // 5. Audit trail record
      this.auditService.recordAction({
        userId: context.user_id,
        action: isRevision ? 'QUOTATION_REVISED' : 'QUOTATION_CREATED',
        entityType: 'QUOTATION',
        entityId: newQuotation.id,
        changes: {
          quotationReference: quotationRef,
          version: newVersion,
          finalCustomerPrice: calculation.final_delivered_price,
          estimatedGrossMargin: calculation.estimated_gross_margin,
          issuedBy: context.user_name,
        },
        ipAddress: context.ip_address,
      });

      db.exec('COMMIT;');

      const updatedOrder = this.orderRepo.findById(order.id)!;
      return { quotation: newQuotation, order: updatedOrder };
    } catch (error) {
      try {
        db.exec('ROLLBACK;');
      } catch {
        // Rollback safety
      }
      throw error;
    }
  }

  getQuotationHistory(orderId: string): Quotation[] {
    return this.quotationRepo.findByOrderId(orderId);
  }
}
