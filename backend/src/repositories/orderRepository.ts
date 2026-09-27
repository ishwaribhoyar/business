import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../db/connection.js';
import { Order, OrderStatus, OrderStatusHistory } from '../models/index.js';

export interface OrderFilterOptions {
  status?: OrderStatus;
  productId?: string;
  limit?: number;
  offset?: number;
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
        status, cancellation_reason, supplier_id, truck_id, driver_id, qr_campaign_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

  updateStatus(id: string, status: OrderStatus, cancellationReason?: string | null): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare('UPDATE orders SET status = ?, cancellation_reason = ?, updated_at = ? WHERE id = ?');
    stmt.run(status, cancellationReason ?? null, now, id);
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

  findAll(options: OrderFilterOptions = {}): { orders: Order[]; total: number } {
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;

    let query = 'SELECT * FROM orders WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    const params: (string | number)[] = [];
    const countParams: (string | number)[] = [];

    if (options.status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(options.status);
      countParams.push(options.status);
    }

    if (options.productId) {
      query += ' AND product_id = ?';
      countQuery += ' AND product_id = ?';
      params.push(options.productId);
      countParams.push(options.productId);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const countStmt = this.db.prepare(countQuery);
    const countResult = countStmt.get(...countParams) as { total: number };

    const stmt = this.db.prepare(query);
    const orders = stmt.all(...params) as unknown as Order[];

    return {
      orders,
      total: countResult.total,
    };
  }
}
