import { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../utils/response.js';
import { CustomerRepository } from '../repositories/customerRepository.js';
import { OrderRepository } from '../repositories/orderRepository.js';
import { ProductRepository } from '../repositories/productRepository.js';
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
import { Order, Customer, OrderStatusHistory, OrderNote } from '../models/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const customerRepo = new CustomerRepository();
const orderRepo = new OrderRepository();
const productRepo = new ProductRepository();
const quotationRepo = new QuotationRepository();
const supplierRepo = new SupplierRepository();
const truckRepo = new TruckRepository();
const driverRepo = new DriverRepository();
const paymentRepo = new PaymentRepository();

const notificationService = new NotificationService();
const auditService = new AuditService();
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

function generateOrderReference(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  let ref = '';
  let attempts = 0;
  do {
    const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
    ref = `NGP-${dateStr}-${randomStr}`;
    attempts++;
  } while (orderRepo.findByReference(ref) && attempts < 100);
  return ref;
}

export class OrderController {
  // -------------------------------------------------------------
  // PUBLIC: Customer Quote Request Flow
  // -------------------------------------------------------------
  static createQuoteRequest(req: Request, res: Response, next: NextFunction): void {
    try {
      const payload = req.body;

      // 1. Resolve product by ID or Slug
      const product = productRepo.findById(payload.material_id) || productRepo.findBySlug(payload.material_id);
      if (!product) {
        throw new NotFoundError(`Material product with id '${payload.material_id}'`);
      }

      // 2. Validate unit compatibility against product configuration
      if (payload.unit && payload.unit.toLowerCase() !== product.unit.toLowerCase()) {
        throw new ValidationError(
          `Selected unit '${payload.unit}' is not compatible with material '${product.name}'. Supported unit is '${product.unit}'.`
        );
      }

      const now = new Date().toISOString();
      const normalizedMobile = payload.mobile_number.replace(/\D/g, '').slice(-10);
      const normalizedWhatsapp = payload.whatsapp_number
        ? payload.whatsapp_number.replace(/\D/g, '').slice(-10)
        : normalizedMobile;

      // 3. Create or resolve customer by mobile number (no password or account needed)
      let customer = customerRepo.findByMobile(normalizedMobile);
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
        customerRepo.create(customer);
      }

      // 4. Duplicate submission protection (idempotency window: 60s)
      const recentDuplicate = orderRepo.findRecentDuplicate(
        customer.id,
        product.id,
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
              `Hi, I recently submitted a quote request (Ref: ${recentDuplicate.order_reference}) for ${payload.quantity} ${payload.unit} of ${product.name} in ${payload.area_pincode}.`
            ),
          },
          200
        );
        return;
      }

      // 5. Create order record in NEW status
      const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const orderRef = generateOrderReference();

      const order: Order = {
        id: orderId,
        order_reference: orderRef,
        customer_id: customer.id,
        product_id: product.id,
        quantity: payload.quantity,
        unit: product.unit,
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
        created_at: now,
        updated_at: now,
      };

      orderRepo.create(order);

      // 6. Record initial status history
      const history: OrderStatusHistory = {
        id: `osh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        order_id: orderId,
        previous_status: null,
        new_status: 'NEW',
        changed_by_user_id: null,
        notes: 'Customer submitted quote request via website',
        created_at: now,
      };
      orderRepo.recordStatusHistory(history);

      // 7. Audit log creation
      auditService.recordAction({
        action: 'CUSTOMER_SUBMITTED_QUOTE_REQUEST',
        entityType: 'ORDER',
        entityId: orderId,
        changes: { orderReference: orderRef, status: 'NEW' },
        ipAddress: req.ip,
      });

      // 8. Trigger notification
      notificationService.notifyOrderReceived(customer.mobile_number, orderRef, customer.full_name);

      ResponseFormatter.success(
        res,
        {
          orderId: order.id,
          orderReference: order.order_reference,
          status: order.status,
          message: 'Your quote request has been received. Our operations team will contact you shortly with the delivered price.',
          whatsappDirectUrl: notificationService.getOperationalWhatsAppUrl(
            `Hi, I just submitted a quote request (Ref: ${orderRef}) for ${payload.quantity} ${payload.unit} of ${product.name} in ${payload.area_pincode}.`
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
  static getOrders(req: Request, res: Response, next: NextFunction): void {
    try {
      const status = req.query.status as string | undefined;
      const paymentStatus = req.query.payment_status as any | undefined;
      const productId = req.query.product_id as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const sortBy = req.query.sort_by as any | undefined;
      const sortOrder = req.query.sort_order === 'ASC' ? 'ASC' : 'DESC';

      const result = orderRepo.findAll({
        status: status as any,
        paymentStatus,
        productId,
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
  static getOrderDetail(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const order = orderRepo.findById(id) || orderRepo.findByReference(id);
      if (!order) {
        throw new NotFoundError(`Order '${id}'`);
      }

      const customer = customerRepo.findById(order.customer_id);
      const product = productRepo.findById(order.product_id);
      const history = orderRepo.getStatusHistory(order.id);
      const notes = orderRepo.getNotes(order.id);

      // Quotations (current active + revision history)
      const quotations = quotationRepo.findByOrderId(order.id);
      const activeQuotation = order.current_quotation_id
        ? quotationRepo.findById(order.current_quotation_id)
        : quotations.length > 0
        ? quotations[0]
        : null;

      // Fulfillment details
      const supplier = order.supplier_id ? supplierRepo.findById(order.supplier_id) : null;
      const truck = order.truck_id ? truckRepo.findById(order.truck_id) : null;
      const driver = order.driver_id ? driverRepo.findById(order.driver_id) : null;

      // Payments & Financial Ledger
      const payments = paymentRepo.findByOrderId(order.id);
      const totalPaid = paymentRepo.getTotalPaidForOrder(order.id);
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
  static updateStatus(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawId = req.params.id;
      const orderId = Array.isArray(rawId) ? rawId[0] : rawId;
      const { status, cancellation_reason, notes } = req.body;
      const user = (req as any).user;

      const result = orderStatusService.transitionStatus({
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
  static createQuotation(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawId = req.params.id;
      const orderId = Array.isArray(rawId) ? rawId[0] : rawId;
      const payload = req.body;
      const user = (req as any).user;

      const result = quotationService.createQuotationSnapshot({
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
  static assignSupplier(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawId = req.params.id;
      const orderId = Array.isArray(rawId) ? rawId[0] : rawId;
      const { supplier_id } = req.body;
      const user = (req as any).user;

      const updatedOrder = fulfillmentService.assignSupplier({
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
  static assignTruck(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawId = req.params.id;
      const orderId = Array.isArray(rawId) ? rawId[0] : rawId;
      const { truck_id, auto_assign_default_driver } = req.body;
      const user = (req as any).user;

      const result = fulfillmentService.assignTruck({
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
  static assignDriver(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawId = req.params.id;
      const orderId = Array.isArray(rawId) ? rawId[0] : rawId;
      const { driver_id } = req.body;
      const user = (req as any).user;

      const result = fulfillmentService.assignDriver({
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
  static recordPayment(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawId = req.params.id;
      const orderId = Array.isArray(rawId) ? rawId[0] : rawId;
      const payload = req.body;
      const user = (req as any).user;

      const result = paymentService.recordPayment({
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
  static addNote(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawId = req.params.id;
      const orderId = Array.isArray(rawId) ? rawId[0] : rawId;
      const { note } = req.body;
      const user = (req as any).user;

      const order = orderRepo.findById(orderId);
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

      orderRepo.addNote(noteRecord);

      auditService.recordAction({
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
