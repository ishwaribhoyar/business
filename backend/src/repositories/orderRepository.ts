import { dbAdapter } from '../db/dbAdapter.js';
import { Order, OrderStatus, OrderStatusHistory, OrderNote, PaymentStatus } from '../models/index.js';

export interface OrderFilterOptions {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  productId?: string;
  categoryId?: string;
  variantId?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'preferred_delivery_date' | 'status' | 'order_reference';
  sortOrder?: 'ASC' | 'DESC';
}

export type OrderListResult = {
  orders: (Order & {
    customer_name?: string;
    customer_mobile?: string;
    product_name?: string;
    category_name?: string;
    variant_name?: string;
    quoted_price?: number;
    quotation_version?: number;
  })[];
  total: number;
};

export type DashboardMetricsResult = {
  totalOrders: number;
  newOrders: number;
  activeDeliveries: number;
  completedOrders: number;
  totalRevenue: number;
  totalDirectCosts: number;
  grossMargin: number;
  ordersByStatus: Record<string, number>;
};

export class OrderRepository {
  create(order: Order): Promise<void> | void {
    const res = dbAdapter.run(`
      INSERT INTO orders (
        id, order_reference, customer_id, product_id, quantity, unit,
        delivery_address, area_pincode, preferred_delivery_date, additional_notes,
        status, cancellation_reason, supplier_id, truck_id, driver_id,
        current_quotation_id, payment_status, qr_campaign_id,
        category_id, variant_id, specifications,
        category_name_snapshot, variant_name_snapshot, specifications_snapshot,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
      order.category_id ?? null,
      order.variant_id ?? null,
      typeof order.specifications === 'object' && order.specifications !== null ? JSON.stringify(order.specifications) : (order.specifications ?? null),
      order.category_name_snapshot ?? null,
      order.variant_name_snapshot ?? null,
      typeof order.specifications_snapshot === 'object' && order.specifications_snapshot !== null ? JSON.stringify(order.specifications_snapshot) : (order.specifications_snapshot ?? null),
      order.created_at,
      order.updated_at,
    ]);
    if (res instanceof Promise) return res.then(() => {});
  }

  findById(id: string): Promise<Order | null> | (Order | null) {
    const query = `
      SELECT o.*,
             COALESCE(o.category_name_snapshot, cat.name, p.name) as category_name,
             COALESCE(o.variant_name_snapshot, v.name) as variant_name
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN product_categories cat ON o.category_id = cat.id
      LEFT JOIN product_variants v ON o.variant_id = v.id
      WHERE o.id = ?
    `;
    return dbAdapter.get<Order>(query, [id]);
  }

  findByReference(reference: string): Promise<Order | null> | (Order | null) {
    const query = `
      SELECT o.*,
             COALESCE(o.category_name_snapshot, cat.name, p.name) as category_name,
             COALESCE(o.variant_name_snapshot, v.name) as variant_name
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN product_categories cat ON o.category_id = cat.id
      LEFT JOIN product_variants v ON o.variant_id = v.id
      WHERE o.order_reference = ?
    `;
    return dbAdapter.get<Order>(query, [reference]);
  }

  findRecentDuplicate(
    customerId: string,
    productId: string,
    quantity: number,
    deliveryAddress: string,
    windowSeconds = 60
  ): Promise<Order | null> | (Order | null) {
    const query = `
      SELECT * FROM orders
      WHERE customer_id = ? AND product_id = ? AND quantity = ? AND delivery_address = ? AND status = 'NEW'
      ORDER BY created_at DESC LIMIT 1
    `;
    const res = dbAdapter.get<Order>(query, [customerId, productId, quantity, deliveryAddress]);
    const checkDuplicate = (order: Order | null) => {
      if (!order) return null;
      const createdTime = new Date(order.created_at).getTime();
      if (!isNaN(createdTime) && (Date.now() - createdTime) <= windowSeconds * 1000) {
        return order;
      }
      return null;
    };
    if (res instanceof Promise) {
      return res.then(checkDuplicate);
    }
    return checkDuplicate(res);
  }

  updateStatus(id: string, status: OrderStatus, cancellationReason?: string | null): Promise<void> | void {
    const now = new Date().toISOString();
    const res = dbAdapter.run(
      'UPDATE orders SET status = ?, cancellation_reason = ?, updated_at = ? WHERE id = ?',
      [status, cancellationReason ?? null, now, id]
    );
    if (res instanceof Promise) return res.then(() => {});
  }

  updateCurrentQuotation(orderId: string, quotationId: string): Promise<void> | void {
    const now = new Date().toISOString();
    const res = dbAdapter.run(
      'UPDATE orders SET current_quotation_id = ?, updated_at = ? WHERE id = ?',
      [quotationId, now, orderId]
    );
    if (res instanceof Promise) return res.then(() => {});
  }

  updateSupplier(orderId: string, supplierId: string | null): Promise<void> | void {
    const now = new Date().toISOString();
    const res = dbAdapter.run(
      'UPDATE orders SET supplier_id = ?, updated_at = ? WHERE id = ?',
      [supplierId, now, orderId]
    );
    if (res instanceof Promise) return res.then(() => {});
  }

  updateTruck(orderId: string, truckId: string | null): Promise<void> | void {
    const now = new Date().toISOString();
    const res = dbAdapter.run(
      'UPDATE orders SET truck_id = ?, updated_at = ? WHERE id = ?',
      [truckId, now, orderId]
    );
    if (res instanceof Promise) return res.then(() => {});
  }

  updateDriver(orderId: string, driverId: string | null): Promise<void> | void {
    const now = new Date().toISOString();
    const res = dbAdapter.run(
      'UPDATE orders SET driver_id = ?, updated_at = ? WHERE id = ?',
      [driverId, now, orderId]
    );
    if (res instanceof Promise) return res.then(() => {});
  }

  updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<void> | void {
    const now = new Date().toISOString();
    const res = dbAdapter.run(
      'UPDATE orders SET payment_status = ?, updated_at = ? WHERE id = ?',
      [paymentStatus, now, orderId]
    );
    if (res instanceof Promise) return res.then(() => {});
  }

  recordStatusHistory(history: OrderStatusHistory): Promise<void> | void {
    const res = dbAdapter.run(`
      INSERT INTO order_status_history (id, order_id, previous_status, new_status, changed_by_user_id, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      history.id,
      history.order_id,
      history.previous_status ?? null,
      history.new_status,
      history.changed_by_user_id ?? null,
      history.notes ?? null,
      history.created_at,
    ]);
    if (res instanceof Promise) return res.then(() => {});
  }

  getStatusHistory(orderId: string): Promise<OrderStatusHistory[]> | OrderStatusHistory[] {
    return dbAdapter.all<OrderStatusHistory>(
      'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC',
      [orderId]
    );
  }

  addNote(note: OrderNote): Promise<void> | void {
    const res = dbAdapter.run(`
      INSERT INTO order_notes (id, order_id, author_id, author_name, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      note.id,
      note.order_id,
      note.author_id ?? null,
      note.author_name,
      note.note,
      note.created_at,
    ]);
    if (res instanceof Promise) return res.then(() => {});
  }

  getNotes(orderId: string): Promise<OrderNote[]> | OrderNote[] {
    return dbAdapter.all<OrderNote>(
      'SELECT * FROM order_notes WHERE order_id = ? ORDER BY created_at DESC',
      [orderId]
    );
  }

  findAll(options: OrderFilterOptions = {}): Promise<OrderListResult> | OrderListResult {
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    const sortBy = options.sortBy ?? 'created_at';
    const sortOrder = options.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    let baseQuery = `
      SELECT o.*, c.full_name as customer_name, c.mobile_number as customer_mobile, p.name as product_name,
             COALESCE(o.category_name_snapshot, cat.name, p.name) as category_name,
             COALESCE(o.variant_name_snapshot, v.name) as variant_name,
             q.final_delivered_price as quoted_price, q.version as quotation_version
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN product_categories cat ON o.category_id = cat.id
      LEFT JOIN product_variants v ON o.variant_id = v.id
      LEFT JOIN quotations q ON o.current_quotation_id = q.id
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN product_categories cat ON o.category_id = cat.id
      LEFT JOIN product_variants v ON o.variant_id = v.id
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

    if (options.categoryId) {
      baseQuery += ' AND (o.category_id = ? OR cat.slug = ?)';
      countQuery += ' AND (o.category_id = ? OR cat.slug = ?)';
      params.push(options.categoryId, options.categoryId);
      countParams.push(options.categoryId, options.categoryId);
    }

    if (options.variantId) {
      baseQuery += ' AND (o.variant_id = ? OR v.slug = ?)';
      countQuery += ' AND (o.variant_id = ? OR v.slug = ?)';
      params.push(options.variantId, options.variantId);
      countParams.push(options.variantId, options.variantId);
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

    const countRes = dbAdapter.get<{ total: number | string }>(countQuery, countParams);
    const ordersRes = dbAdapter.all<any>(baseQuery, params);

    if (countRes instanceof Promise || ordersRes instanceof Promise) {
      return Promise.all([countRes, ordersRes]).then(([cR, oR]) => ({
        orders: (oR || []) as any,
        total: Number(cR?.total ?? 0),
      }));
    }

    return {
      orders: (ordersRes || []) as any,
      total: Number(countRes?.total ?? 0),
    };
  }

  getDashboardMetrics(): Promise<DashboardMetricsResult> | DashboardMetricsResult {
    const statusCountsStmt = `
      SELECT status, COUNT(*) as count FROM orders GROUP BY status
    `;
    const statusCountsRes = dbAdapter.all<{ status: string; count: number | string }>(statusCountsStmt);

    const financialQuery = `
      SELECT 
        COALESCE(SUM(q.final_delivered_price), 0) as total_revenue,
        COALESCE(SUM(q.material_cost + q.transport_cost + q.loading_cost), 0) as total_direct_costs
      FROM orders o
      JOIN quotations q ON o.current_quotation_id = q.id
      WHERE o.status IN ('CONFIRMED', 'SUPPLIER_ASSIGNED', 'TRUCK_ASSIGNED', 'LOADING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED')
    `;
    const financialRes = dbAdapter.get<{ total_revenue: number | string; total_direct_costs: number | string }>(financialQuery);

    const computeMetrics = (
      statusRows: { status: string; count: number | string }[],
      financialRow?: { total_revenue: number | string; total_direct_costs: number | string } | null
    ): DashboardMetricsResult => {
      const ordersByStatus: Record<string, number> = {};
      let totalOrders = 0;
      for (const row of statusRows || []) {
        const count = Number(row.count);
        ordersByStatus[row.status] = count;
        totalOrders += count;
      }

      const totalRevenue = Number(financialRow?.total_revenue ?? 0);
      const totalDirectCosts = Number(financialRow?.total_direct_costs ?? 0);
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
    };

    if (statusCountsRes instanceof Promise || financialRes instanceof Promise) {
      return Promise.all([statusCountsRes, financialRes]).then(([sRows, fRow]) => computeMetrics(sRows, fRow));
    }

    return computeMetrics(statusCountsRes, financialRes);
  }
}
