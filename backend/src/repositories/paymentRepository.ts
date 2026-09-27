import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../db/connection.js';
import { Payment } from '../models/index.js';

export class PaymentRepository {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db ?? getDatabase();
  }

  create(payment: Payment): void {
    const stmt = this.db.prepare(`
      INSERT INTO payments (
        id, order_id, amount, payment_method, payment_status,
        transaction_reference, notes, recorded_by_user_id, payment_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      payment.id,
      payment.order_id,
      payment.amount,
      payment.payment_method,
      payment.payment_status,
      payment.transaction_reference ?? null,
      payment.notes ?? null,
      payment.recorded_by_user_id,
      payment.payment_date,
      payment.created_at
    );
  }

  findByOrderId(orderId: string): Payment[] {
    const stmt = this.db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY payment_date DESC, created_at DESC');
    return (stmt.all(orderId) as unknown as Payment[]) || [];
  }

  findById(id: string): Payment | null {
    const stmt = this.db.prepare('SELECT * FROM payments WHERE id = ?');
    const result = stmt.get(id);
    return (result as unknown as Payment) || null;
  }

  getTotalPaidForOrder(orderId: string): number {
    const stmt = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_paid
      FROM payments
      WHERE order_id = ? AND payment_status != 'Refunded'
    `);
    const result = stmt.get(orderId) as { total_paid: number } | undefined;
    return result?.total_paid ?? 0;
  }

  findAll(limit = 50, offset = 0): { payments: Payment[]; total: number } {
    const countStmt = this.db.prepare('SELECT COUNT(*) as total FROM payments');
    const countResult = countStmt.get() as { total: number };

    const stmt = this.db.prepare('SELECT * FROM payments ORDER BY created_at DESC LIMIT ? OFFSET ?');
    const payments = stmt.all(limit, offset) as unknown as Payment[];

    return {
      payments,
      total: countResult.total,
    };
  }
}
