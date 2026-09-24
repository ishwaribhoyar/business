import { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../utils/response.js';
import { CustomerRepository } from '../repositories/customerRepository.js';
import { OrderRepository } from '../repositories/orderRepository.js';
import { ProductRepository } from '../repositories/productRepository.js';
import { NotificationService } from '../services/notificationService.js';
import { AuditService } from '../services/auditService.js';
import { Order, Customer, OrderStatusHistory } from '../models/index.js';
import { NotFoundError } from '../utils/errors.js';

const customerRepo = new CustomerRepository();
const orderRepo = new OrderRepository();
const productRepo = new ProductRepository();
const notificationService = new NotificationService();
const auditService = new AuditService();

function generateOrderReference(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
  return `NGP-${dateStr}-${randomStr}`;
}

export class OrderController {
  static createQuoteRequest(req: Request, res: Response, next: NextFunction): void {
    try {
      const payload = req.body;

      const product = productRepo.findById(payload.material_id);
      if (!product) {
        throw new NotFoundError(`Material product with id '${payload.material_id}'`);
      }

      const now = new Date().toISOString();

      // 1. Create or resolve customer by mobile number
      let customer = customerRepo.findByMobile(payload.mobile_number);
      if (!customer) {
        customer = {
          id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          full_name: payload.customer_name,
          mobile_number: payload.mobile_number,
          whatsapp_number: payload.whatsapp_number || payload.mobile_number,
          delivery_address: payload.delivery_address,
          area_pincode: payload.area_pincode,
          map_pin_url: payload.map_pin_url || null,
          internal_notes: null,
          created_at: now,
          updated_at: now,
        };
        customerRepo.create(customer);
      }

      // 2. Create order record in NEW status
      const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const orderRef = generateOrderReference();

      const order: Order = {
        id: orderId,
        order_reference: orderRef,
        customer_id: customer.id,
        product_id: product.id,
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
        qr_campaign_id: payload.qr_campaign_code || null,
        created_at: now,
        updated_at: now,
      };

      orderRepo.create(order);

      // 3. Record initial status history
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

      // 4. Audit log creation
      auditService.recordAction({
        action: 'CUSTOMER_SUBMITTED_QUOTE_REQUEST',
        entityType: 'ORDER',
        entityId: orderId,
        changes: { orderReference: orderRef, status: 'NEW' },
        ipAddress: req.ip,
      });

      // 5. Trigger notification
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

  static getOrders(req: Request, res: Response, next: NextFunction): void {
    try {
      const status = req.query.status as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = orderRepo.findAll({
        status: status as any,
        limit,
        offset,
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

      ResponseFormatter.success(res, {
        order,
        customer,
        product,
        statusHistory: history,
      });
    } catch (error) {
      next(error);
    }
  }
}
