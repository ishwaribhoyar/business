import { dbAdapter } from '../db/dbAdapter.js';
import { Payment } from '../models/index.js';

export class PaymentRepository {
  create(payment: Payment): Promise<void> | void {
    const res = dbAdapter.run(`
      INSERT INTO payments (
        id, order_id, amount, payment_method, payment_status,
        transaction_reference, notes, recorded_by_user_id, payment_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      payment.id,
      payment.order_id,
      payment.amount,
      payment.payment_method,
      payment.payment_status,
      payment.transaction_reference ?? null,
      payment.notes ?? null,
      payment.recorded_by_user_id,
      payment.payment_date,
      payment.created_at,
    ]);
    if (res instanceof Promise) return res.then(() => {});
  }

  findByOrderId(orderId: string): Promise<Payment[]> | Payment[] {
    return dbAdapter.all<Payment>(
      'SELECT * FROM payments WHERE order_id = ? ORDER BY payment_date DESC, created_at DESC',
      [orderId]
    );
  }

  findById(id: string): Promise<Payment | null> | (Payment | null) {
    return dbAdapter.get<Payment>('SELECT * FROM payments WHERE id = ?', [id]);
  }

  getTotalPaidForOrder(orderId: string): Promise<number> | number {
    const sql = `
      SELECT COALESCE(SUM(amount), 0) as total_paid
      FROM payments
      WHERE order_id = ? AND payment_status != 'Refunded'
    `;
    if (dbAdapter.isPostgres) {
      return (async () => {
        const res = await dbAdapter.get<{ total_paid: number | string }>(sql, [orderId]);
        return Number(res?.total_paid || 0);
      })();
    }
    const res = dbAdapter.get<{ total_paid: number }>(sql, [orderId]) as { total_paid: number } | null;
    return Number(res?.total_paid || 0);
  }

  findAll(limit = 50, offset = 0): Promise<{ payments: Payment[]; total: number }> | { payments: Payment[]; total: number } {
    if (dbAdapter.isPostgres) {
      return (async () => {
        const countRes = await dbAdapter.get<{ total: number | string }>('SELECT COUNT(*) as total FROM payments');
        const payments = await dbAdapter.all<Payment>(
          'SELECT * FROM payments ORDER BY created_at DESC LIMIT ? OFFSET ?',
          [limit, offset]
        );
        return {
          payments,
          total: Number(countRes?.total || 0),
        };
      })();
    }

    const countResult = dbAdapter.get<{ total: number }>('SELECT COUNT(*) as total FROM payments') as { total: number } | null;
    const payments = dbAdapter.all<Payment>(
      'SELECT * FROM payments ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    ) as Payment[];

    return {
      payments,
      total: Number(countResult?.total || 0),
    };
  }
}
