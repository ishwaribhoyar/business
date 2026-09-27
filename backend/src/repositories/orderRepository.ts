import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../db/connection.js';
import { Order, OrderStatus, OrderStatusHistory, OrderNote, PaymentStatus } from '../models/index.js';

export interface OrderFilterOptions {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  productId?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'preferred_delivery_date' | 'status' | 'order_reference';
  sortOrder?: 'ASC' | 'DESC';
}

export class OrderRepository {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db ?? getDatabase();
  }

  create(order: Order): void {
    const stmt = this.db.prepare(`
      INSERT INTO orders (
        id, order_reference, customer_id, product_id, quantity, unit,
        delivery_address, area_pincode, preferred_delivery_date, additional_notes,
        status, cancellation_reason, supplier_id, truck_id, driver_id,
        current_quotation_id, payment_status, qr_campaign_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      order.id,
      order.order_reference,
      order.customer_id,
      order.product_id,
      order.quantity,
      order.unit,
      order.delivery_address,
      order.area_pincode,
      order.preferred_delivery_date,
      order.additional_notes ?? null,
      order.status,
      order.cancellation_reason ?? null,
      order.supplier_id ?? null,
      order.truck_id ?? null,
      order.driver_id ?? null,
      order.current_quotation_id ?? null,
      order.payment_status ?? 'Pending',
      order.qr_campaign_id ?? null,
      order.created_at,
      order.updated_at
    );
  }

  findById(id: string): Order | null {
    const stmt = this.db.prepare('SELECT * FROM orders WHERE id = ?');
    const result = stmt.get(id);
    return (result as unknown as Order) || null;
  }

  findByReference(reference: string): Order | null {
    const stmt = this.db.prepare('SELECT * FROM orders WHERE order_reference = ?');
    const result = stmt.get(reference);
    return (result as unknown as Order) || null;
  }

  findRecentDuplicate(
    customerId: string,
    productId: string,
    quantity: number,
    deliveryAddress: string,
    windowSeconds = 60
  ): Order | null {
    const stmt = this.db.prepare(`
      SELECT * FROM orders
      WHERE customer_id = ? AND product_id = ? AND quantity = ? AND delivery_address = ? AND status = 'NEW'
      ORDER BY created_at DESC LIMIT 1
    `);
    const order = stmt.get(customerId, productId, quantity, deliveryAddress) as unknown as Order | undefined;
    if (!order) return null;

    const createdTime = new Date(order.created_at).getTime();
    if (!isNaN(createdTime) && (Date.now() - createdTime) <= windowSeconds * 1000) {
      return order;
    }
    return null;
  }

  updateStatus(id: string, status: OrderStatus, cancellationReason?: string | null): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare('UPDATE orders SET status = ?, cancellation_reason = ?, updated_at = ? WHERE id = ?');
    stmt.run(status, cancellationReason ?? null, now, id);
  }

  updateCurrentQuotation(orderId: string, quotationId: string): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare('UPDATE orders SET current_quotation_id = ?, updated_at = ? WHERE id = ?');
    stmt.run(quotationId, now, orderId);
  }

  updateSupplier(orderId: string, supplierId: string | null): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare('UPDATE orders SET supplier_id = ?, updated_at = ? WHERE id = ?');
    stmt.run(supplierId, now, orderId);
  }

  updateTruck(orderId: string, truckId: string | null): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare('UPDATE orders SET truck_id = ?, updated_at = ? WHERE id = ?');
    stmt.run(truckId, now, orderId);
  }

  updateDriver(orderId: string, driverId: string | null): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare('UPDATE orders SET driver_id = ?, updated_at = ? WHERE id = ?');
    stmt.run(driverId, now, orderId);
  }

  updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare('UPDATE orders SET payment_status = ?, updated_at = ? WHERE id = ?');
    stmt.run(paymentStatus, now, orderId);
  }

  recordStatusHistory(history: OrderStatusHistory): void {
    const stmt = this.db.prepare(`
      INSERT INTO order_status_history (id, order_id, previous_status, new_status, changed_by_user_id, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      history.id,
      history.order_id,
      history.previous_status ?? null,
      history.new_status,
      history.changed_by_user_id ?? null,
      history.notes ?? null,
      history.created_at
    );
  }

  getStatusHistory(orderId: string): OrderStatusHistory[] {
    const stmt = this.db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC');
    return (stmt.all(orderId) as unknown as OrderStatusHistory[]) || [];
  }

  addNote(note: OrderNote): void {
    const stmt = this.db.prepare(`
      INSERT INTO order_notes (id, order_id, author_id, author_name, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(note.id, note.order_id, note.author_id ?? null, note.author_name, note.note, note.created_at);
  }

  getNotes(orderId: string): OrderNote[] {
    const stmt = this.db.prepare('SELECT * FROM order_notes WHERE order_id = ? ORDER BY created_at DESC');
    return (stmt.all(orderId) as unknown as OrderNote[]) || [];
  }

  findAll(options: OrderFilterOptions = {}): {
    orders: (Order & { customer_name?: string; customer_mobile?: string; product_name?: string })[];
    total: number;
  } {
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    const sortBy = options.sortBy ?? 'created_at';
    const sortOrder = options.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    let baseQuery = `
      SELECT o.*, c.full_name as customer_name, c.mobile_number as customer_mobile, p.name as product_name,
             q.final_delivered_price as quoted_price, q.version as quotation_version
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN quotations q ON o.current_quotation_id = q.id
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];
    const countParams: (string | number)[] = [];

    if (options.status) {
      baseQuery += ' AND o.status = ?';
      countQuery += ' AND o.status = ?';
      params.push(options.status);
      countParams.push(options.status);
    }

    if (options.paymentStatus) {
      baseQuery += ' AND o.payment_status = ?';
      countQuery += ' AND o.payment_status = ?';
      params.push(options.paymentStatus);
      countParams.push(options.paymentStatus);
    }

    if (options.productId) {
      baseQuery += ' AND o.product_id = ?';
      countQuery += ' AND o.product_id = ?';
      params.push(options.productId);
      countParams.push(options.productId);
    }

    if (options.search && options.search.trim()) {
      const term = `%${options.search.trim()}%`;
      const searchClause =
        ' AND (o.order_reference LIKE ? OR o.area_pincode LIKE ? OR o.delivery_address LIKE ? OR c.full_name LIKE ? OR c.mobile_number LIKE ?)';
      baseQuery += searchClause;
      countQuery += searchClause;
      for (let i = 0; i < 5; i++) {
        params.push(term);
        countParams.push(term);
      }
    }

    // Sanitize sort column to prevent SQL injection
    const allowedSortColumns = ['created_at', 'preferred_delivery_date', 'status', 'order_reference'];
    const safeSortCol = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';

    baseQuery += ` ORDER BY o.${safeSortCol} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const countStmt = this.db.prepare(countQuery);
    const countResult = countStmt.get(...countParams) as { total: number };

    const stmt = this.db.prepare(baseQuery);
    const orders = stmt.all(...params) as unknown as (Order & {
      customer_name?: string;
      customer_mobile?: string;
      product_name?: string;
    })[];

    return {
      orders,
      total: countResult.total,
    };
  }

  getDashboardMetrics(): {
    totalOrders: number;
    newOrders: number;
    activeDeliveries: number;
    completedOrders: number;
    totalRevenue: number;
    totalDirectCosts: number;
    grossMargin: number;
    ordersByStatus: Record<string, number>;
  } {
    // Real aggregations from database
    const statusCountsStmt = this.db.prepare(`
      SELECT status, COUNT(*) as count FROM orders GROUP BY status
    `);
    const statusRows = statusCountsStmt.all() as { status: string; count: number }[];
    const ordersByStatus: Record<string, number> = {};
    let totalOrders = 0;
    for (const row of statusRows) {
      ordersByStatus[row.status] = row.count;
      totalOrders += row.count;
    }

    // Revenue and direct costs computed from actual issued/active quotations for orders that reached CONFIRMED or later
    const financialStmt = this.db.prepare(`
      SELECT 
        COALESCE(SUM(q.final_delivered_price), 0) as total_revenue,
        COALESCE(SUM(q.material_cost + q.transport_cost + q.loading_cost), 0) as total_direct_costs
      FROM orders o
      JOIN quotations q ON o.current_quotation_id = q.id
      WHERE o.status IN ('CONFIRMED', 'SUPPLIER_ASSIGNED', 'TRUCK_ASSIGNED', 'LOADING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED')
    `);
    const financialRow = financialStmt.get() as { total_revenue: number; total_direct_costs: number } | undefined;

    const totalRevenue = financialRow?.total_revenue ?? 0;
    const totalDirectCosts = financialRow?.total_direct_costs ?? 0;
    const grossMargin = totalRevenue - totalDirectCosts;

    return {
      totalOrders,
      newOrders: ordersByStatus['NEW'] || 0,
      activeDeliveries: (ordersByStatus['OUT_FOR_DELIVERY'] || 0) + (ordersByStatus['LOADING'] || 0),
      completedOrders: (ordersByStatus['COMPLETED'] || 0) + (ordersByStatus['DELIVERED'] || 0),
      totalRevenue,
      totalDirectCosts,
      grossMargin,
      ordersByStatus,
    };
  }
}
