import { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../utils/response.js';
import { CustomerRepository } from '../repositories/customerRepository.js';
import { OrderRepository } from '../repositories/orderRepository.js';
import { ProductRepository } from '../repositories/productRepository.js';
import { CategoryRepository } from '../repositories/categoryRepository.js';
import { VariantRepository } from '../repositories/variantRepository.js';
import { QuotationRepository } from '../repositories/quotationRepository.js';
import { SupplierRepository } from '../repositories/supplierRepository.js';
import { TruckRepository } from '../repositories/truckRepository.js';
import { DriverRepository } from '../repositories/driverRepository.js';
import { PaymentRepository } from '../repositories/paymentRepository.js';
import { NotificationService } from '../services/notificationService.js';
import { AuditService } from '../services/auditService.js';
import { OrderStatusService } from '../services/orderStatusService.js';
import { QuotationService } from '../services/quotationService.js';
import { FulfillmentService } from '../services/fulfillmentService.js';
import { PaymentService } from '../services/paymentService.js';
import { CatalogService } from '../services/catalogService.js';
import { Order, Customer, OrderStatusHistory, OrderNote } from '../models/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const customerRepo = new CustomerRepository();
const orderRepo = new OrderRepository();
const productRepo = new ProductRepository();
const categoryRepo = new CategoryRepository();
const variantRepo = new VariantRepository();
const quotationRepo = new QuotationRepository();
const supplierRepo = new SupplierRepository();
const truckRepo = new TruckRepository();
const driverRepo = new DriverRepository();
const paymentRepo = new PaymentRepository();

const notificationService = new NotificationService();
const auditService = new AuditService();
const catalogService = new CatalogService(categoryRepo, variantRepo);
const orderStatusService = new OrderStatusService(orderRepo, quotationRepo, auditService);
const quotationService = new QuotationService(quotationRepo, orderRepo, auditService);
const fulfillmentService = new FulfillmentService(
  orderRepo,
  supplierRepo,
  truckRepo,
  driverRepo,
  productRepo,
  auditService
);
const paymentService = new PaymentService(paymentRepo, orderRepo, quotationRepo, auditService);

async function generateOrderReference(): Promise<string> {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  let ref = '';
  let attempts = 0;
  do {
    const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
    ref = `NGP-${dateStr}-${randomStr}`;
    attempts++;
  } while ((await orderRepo.findByReference(ref)) && attempts < 100);
  return ref;
}

export class OrderController {
  // -------------------------------------------------------------
  // PUBLIC: Customer Quote Request Flow
  // -------------------------------------------------------------
  static async createQuoteRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = req.body;

      // 1. Resolve Category, Variant, and Product
      let category = null;
      let variant = null;
      let validatedSpecs: Record<string, string> = {};

      if (payload.variant_id) {
        variant = (await variantRepo.findById(payload.variant_id)) || (await variantRepo.findBySlug(payload.variant_id));
        if (!variant) {
          throw new NotFoundError(`Material variant '${payload.variant_id}'`);
        }
        if (variant.is_active === 0 || (variant.is_active as any) === false) {
          throw new ValidationError(`Material variant '${variant.name}' is currently inactive and cannot be selected.`);
        }
        category = await categoryRepo.findById(variant.category_id);
        if (!category || category.is_active === 0 || (category.is_active as any) === false) {
          throw new ValidationError(`Material category for variant '${variant.name}' is inactive.`);
        }
        // Validate specs
        validatedSpecs = catalogService.validateSpecifications(variant, payload.specifications);
        // Validate quantity & unit
        catalogService.validateQuantityAndUnit(variant, payload.quantity, payload.unit);
      } else {
        // Fallback for legacy material_id / category_id
        const identifier = payload.category_id || payload.material_id;
        if (!identifier) {
          throw new ValidationError('A material category or variant selection is required.');
        }
        category = (await categoryRepo.findBySlug(identifier)) || (await categoryRepo.findById(identifier));
        const legacyProduct = (await productRepo.findById(identifier)) || (await productRepo.findBySlug(identifier));

        if (!category && !legacyProduct) {
          throw new NotFoundError(`Material product '${identifier}'`);
        }

        // If category found, pick first active variant if available
        if (category) {
          const variants = (await variantRepo.findByCategory(category.id, true)) as any[];
          if (variants.length > 0) {
            variant = variants[0];
            if (payload.specifications) {
              validatedSpecs = catalogService.validateSpecifications(variant, payload.specifications);
            }
            if (payload.unit && payload.unit.toLowerCase() !== variant.unit.toLowerCase()) {
              throw new ValidationError(
                `Selected unit '${payload.unit}' is not compatible with material '${category.name}'. Supported unit is '${variant.unit}'.`
              );
            }
          }
        } else if (legacyProduct) {
          if (payload.unit && payload.unit.toLowerCase() !== legacyProduct.unit.toLowerCase()) {
            throw new ValidationError(
              `Selected unit '${payload.unit}' is not compatible with material '${legacyProduct.name}'. Supported unit is '${legacyProduct.unit}'.`
            );
          }
        }
      }

      const activeProds = (await productRepo.findAllActive()) as any[];
      const legacyFallback =
        (category?.slug ? await productRepo.findBySlug(category.slug) : null) ||
        (variant?.id ? await productRepo.findById(variant.id) : null) ||
        activeProds[0];
      const productId = legacyFallback?.id || variant?.id || category?.id || 'prod_material';
      const productName = variant?.name || category?.name || legacyFallback?.name || 'Bulk Material';

      const now = new Date().toISOString();
      const normalizedMobile = payload.mobile_number.replace(/\D/g, '').slice(-10);
      const normalizedWhatsapp = payload.whatsapp_number
        ? payload.whatsapp_number.replace(/\D/g, '').slice(-10)
        : normalizedMobile;

      // 2. Create or resolve customer by mobile number (no password or account needed)
      let customer = await customerRepo.findByMobile(normalizedMobile);
      if (!customer) {
        customer = {
          id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          full_name: payload.customer_name,
          mobile_number: normalizedMobile,
          whatsapp_number: normalizedWhatsapp,
          delivery_address: payload.delivery_address,
          area_pincode: payload.area_pincode,
          map_pin_url: payload.map_pin_url || null,
          internal_notes: null,
          created_at: now,
          updated_at: now,
        };
        await customerRepo.create(customer);
      }

      // 3. Duplicate submission protection (idempotency window: 60s)
      const recentDuplicate = await orderRepo.findRecentDuplicate(
        customer.id,
        productId,
        payload.quantity,
        payload.delivery_address,
        60
      );

      if (recentDuplicate) {
        ResponseFormatter.success(
          res,
          {
            orderId: recentDuplicate.id,
            orderReference: recentDuplicate.order_reference,
            status: recentDuplicate.status,
            message: 'Your quote request has already been received and is being processed by our operations desk.',
            whatsappDirectUrl: notificationService.getOperationalWhatsAppUrl(
              `Hi, I recently submitted a quote request (Ref: ${recentDuplicate.order_reference}) for ${payload.quantity} ${payload.unit} of ${productName} in ${payload.area_pincode}.`
            ),
          },
          200
        );
        return;
      }

      // 4. Create order record in NEW status with Phase 3 snapshots
      const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const orderRef = await generateOrderReference();

      const categoryNameSnapshot = category?.name ?? legacyFallback?.name ?? 'Building Material';
      const variantNameSnapshot = variant?.name ?? null;
      const specsSnapshot = Object.keys(validatedSpecs).length > 0
        ? JSON.stringify(validatedSpecs)
        : (payload.specifications ? JSON.stringify(payload.specifications) : null);

      const order: Order = {
        id: orderId,
        order_reference: orderRef,
        customer_id: customer.id,
        product_id: productId,
        quantity: payload.quantity,
        unit: payload.unit,
        delivery_address: payload.delivery_address,
        area_pincode: payload.area_pincode,
        preferred_delivery_date: payload.preferred_delivery_date,
        additional_notes: payload.additional_notes || null,
        status: 'NEW',
        cancellation_reason: null,
        supplier_id: null,
        truck_id: null,
        driver_id: null,
        current_quotation_id: null,
        payment_status: 'Pending',
        qr_campaign_id: payload.qr_campaign_code || null,
        category_id: category?.id ?? null,
        variant_id: variant?.id ?? null,
        specifications: specsSnapshot,
        category_name_snapshot: categoryNameSnapshot,
        variant_name_snapshot: variantNameSnapshot,
        specifications_snapshot: specsSnapshot,
        created_at: now,
        updated_at: now,
      };

      await orderRepo.create(order);

      // 5. Record initial status history
      const history: OrderStatusHistory = {
        id: `osh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        order_id: orderId,
        previous_status: null,
        new_status: 'NEW',
        changed_by_user_id: null,
        notes: 'Customer submitted quote request via website',
        created_at: now,
      };
      await orderRepo.recordStatusHistory(history);

      // 6. Audit log creation
      await auditService.recordAction({
        action: 'CUSTOMER_SUBMITTED_QUOTE_REQUEST',
        entityType: 'ORDER',
        entityId: orderId,
        changes: {
          orderReference: orderRef,
          status: 'NEW',
          category: categoryNameSnapshot,
          variant: variantNameSnapshot,
          quantity: payload.quantity,
          unit: payload.unit,
        },
        ipAddress: req.ip,
      });

      // 7. Trigger notification
      notificationService.notifyOrderReceived(customer.mobile_number, orderRef, customer.full_name);

      // Format WhatsApp prefill text
      let materialDisplay = variantNameSnapshot
        ? `${variantNameSnapshot} (${categoryNameSnapshot})`
        : categoryNameSnapshot;
      if (Object.keys(validatedSpecs).length > 0) {
        const specsText = Object.entries(validatedSpecs)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        materialDisplay += ` [${specsText}]`;
      }

      ResponseFormatter.success(
        res,
        {
          orderId: order.id,
          orderReference: order.order_reference,
          status: order.status,
          message: 'Your quote request has been received. Our operations team will contact you shortly with the delivered price.',
          whatsappDirectUrl: notificationService.getOperationalWhatsAppUrl(
            `Hi, I just submitted a quote request (Ref: ${orderRef}) for ${payload.quantity} ${payload.unit} of ${materialDisplay} in ${payload.area_pincode}.`
          ),
        },
        201
      );
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // ADMIN: Orders List with Search & Filtering
  // -------------------------------------------------------------
  static async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const paymentStatus = req.query.payment_status as any | undefined;
      const productId = req.query.product_id as string | undefined;
      const categoryId = req.query.category_id as string | undefined;
      const variantId = req.query.variant_id as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const sortBy = req.query.sort_by as any | undefined;
      const sortOrder = req.query.sort_order === 'ASC' ? 'ASC' : 'DESC';

      const result = await orderRepo.findAll({
        status: status as any,
        paymentStatus,
        productId,
        categoryId,
        variantId,
        search,
        limit,
        offset,
        sortBy,
        sortOrder,
      });

      ResponseFormatter.success(res, result.orders, 200, {
        total: result.total,
        limit,
        page: Math.floor(offset / limit) + 1,
      });
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // ADMIN: Comprehensive Order Detail (The Operational Hub)
  // -------------------------------------------------------------
  static async getOrderDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const order = (await orderRepo.findById(id)) || (await orderRepo.findByReference(id));
      if (!order) {
        throw new NotFoundError(`Order '${id}'`);
      }

      const customer = await customerRepo.findById(order.customer_id);
      const product = await productRepo.findById(order.product_id);
      const history = await orderRepo.getStatusHistory(order.id);
      const notes = await orderRepo.getNotes(order.id);

      // Quotations (current active + revision history)
      const quotations = (await quotationRepo.findByOrderId(order.id)) as any[];
      const activeQuotation = order.current_quotation_id
        ? await quotationRepo.findById(order.current_quotation_id)
        : quotations.length > 0
        ? quotations[0]
        : null;

      // Fulfillment details
      const supplier = order.supplier_id ? await supplierRepo.findById(order.supplier_id) : null;
      const truck = order.truck_id ? await truckRepo.findById(order.truck_id) : null;
      const driver = order.driver_id ? await driverRepo.findById(order.driver_id) : null;

      // Payments & Financial Ledger
      const payments = (await paymentRepo.findByOrderId(order.id)) as any[];
      const totalPaid = await paymentRepo.getTotalPaidForOrder(order.id);
      const finalCustomerPrice = activeQuotation?.final_delivered_price ?? 0;
      const balanceDue = Math.max(0, finalCustomerPrice - totalPaid);

      ResponseFormatter.success(res, {
        order,
        customer,
        product,
        activeQuotation,
        quotations,
        supplier,
        truck,
        driver,
        payments,
        paymentSummary: {
          totalPaid,
          finalCustomerPrice,
          balanceDue,
          paymentStatus: order.payment_status,
        },
        statusHistory: history,
        notes,
      });
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // ADMIN: Status Transition via State Machine
  // -------------------------------------------------------------
  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const orderId = Array.isArray(rawId) ? rawId[0] : rawId;
      const { status, cancellation_reason, notes } = req.body;
      const user = (req as any).user;

      const result = await orderStatusService.transitionStatus({
        orderId,
        targetStatus: status,
        cancellationReason: cancellation_reason,
        notes,
        userId: user.id,
        userName: user.email,
        ipAddress: req.ip,
      });

      ResponseFormatter.success(
        res,
        {
          order: result.order,
          statusHistory: result.history,
          message: `Order status successfully transitioned to '${status}'.`,
        },
        200
      );
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // ADMIN: Manual Quotation Snapshot Creation / Revision
  // -------------------------------------------------------------
  static async createQuotation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const orderId = Array.isArray(rawId) ? rawId[0] : rawId;
      const payload = req.body;
      const user = (req as any).user;

      const result = await quotationService.createQuotationSnapshot({
        order_id: orderId,
        material_cost: payload.material_cost,
        transport_cost: payload.transport_cost,
        loading_cost: payload.loading_cost,
        platform_fee: payload.platform_fee,
        discount: payload.discount,
        validity_date: payload.validity_date,
        notes: payload.notes,
        advance_order_status: payload.advance_order_status ?? true,
        user_id: user.id,
        user_name: user.email,
        ip_address: req.ip,
      });

      ResponseFormatter.success(
        res,
        {
          quotation: result.quotation,
          order: result.order,
          message: `Quotation ${result.quotation.quotation_reference} created successfully.`,
        },
        201
      );
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // ADMIN: Assign Supplier to Order
  // -------------------------------------------------------------
  static async assignSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const orderId = Array.isArray(rawId) ? rawId[0] : rawId;
      const { supplier_id } = req.body;
      const user = (req as any).user;

      const updatedOrder = await fulfillmentService.assignSupplier({
        orderId,
        supplierId: supplier_id,
        userId: user.id,
        userName: user.email,
        ipAddress: req.ip,
      });

      ResponseFormatter.success(res, {
        order: updatedOrder,
        message: 'Supplier assigned successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // ADMIN: Assign Truck to Order
  // -------------------------------------------------------------
  static async assignTruck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const orderId = Array.isArray(rawId) ? rawId[0] : rawId;
      const { truck_id, auto_assign_default_driver } = req.body;
      const user = (req as any).user;

      const result = await fulfillmentService.assignTruck({
        orderId,
        truckId: truck_id,
        autoAssignDefaultDriver: auto_assign_default_driver ?? true,
        userId: user.id,
        userName: user.email,
        ipAddress: req.ip,
      });

      ResponseFormatter.success(res, {
        order: result.order,
        warnings: result.warnings,
        message: 'Truck assigned successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // ADMIN: Assign Driver to Order
  // -------------------------------------------------------------
  static async assignDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const orderId = Array.isArray(rawId) ? rawId[0] : rawId;
      const { driver_id } = req.body;
      const user = (req as any).user;

      const result = await fulfillmentService.assignDriver({
        orderId,
        driverId: driver_id,
        userId: user.id,
        userName: user.email,
        ipAddress: req.ip,
      });

      ResponseFormatter.success(res, {
        order: result.order,
        warnings: result.warnings,
        message: 'Driver assigned successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // ADMIN: Record Order Payment
  // -------------------------------------------------------------
  static async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const orderId = Array.isArray(rawId) ? rawId[0] : rawId;
      const payload = req.body;
      const user = (req as any).user;

      const result = await paymentService.recordPayment({
        order_id: orderId,
        amount: payload.amount,
        payment_method: payload.payment_method,
        payment_status: payload.payment_status,
        transaction_reference: payload.transaction_reference,
        notes: payload.notes,
        payment_date: payload.payment_date,
        user_id: user.id,
        user_name: user.email,
        ip_address: req.ip,
      });

      ResponseFormatter.success(
        res,
        {
          payment: result.payment,
          order: result.order,
          totalPaid: result.totalPaid,
          balanceDue: result.balanceDue,
          message: 'Payment recorded successfully.',
        },
        201
      );
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // ADMIN: Add Operational Internal Note
  // -------------------------------------------------------------
  static async addNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const orderId = Array.isArray(rawId) ? rawId[0] : rawId;
      const { note } = req.body;
      const user = (req as any).user;

      const order = await orderRepo.findById(orderId);
      if (!order) {
        throw new NotFoundError(`Order '${orderId}'`);
      }

      const noteRecord: OrderNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        order_id: order.id,
        author_id: user.id,
        author_name: user.email,
        note: note.trim(),
        created_at: new Date().toISOString(),
      };

      await orderRepo.addNote(noteRecord);

      await auditService.recordAction({
        userId: user.id,
        action: 'ORDER_NOTE_ADDED',
        entityType: 'ORDER',
        entityId: order.id,
        changes: { noteLength: note.length, author: user.email },
        ipAddress: req.ip,
      });

      ResponseFormatter.success(res, {
        note: noteRecord,
        message: 'Operational note added successfully.',
      }, 201);
    } catch (error) {
      next(error);
    }
  }
}
