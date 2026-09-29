import { dbAdapter } from '../db/dbAdapter.js';
import { Quotation, QuotationStatus } from '../models/index.js';

export class QuotationRepository {
  create(quotation: Quotation): Promise<void> | void {
    const res = dbAdapter.run(`
      INSERT INTO quotations (
        id, quotation_reference, order_id, version, quotation_status,
        material_cost, transport_cost, loading_cost, platform_fee, discount,
        final_delivered_price, estimated_gross_margin, validity_date, notes,
        created_by_user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      quotation.id,
      quotation.quotation_reference,
      quotation.order_id,
      quotation.version ?? 1,
      quotation.quotation_status ?? 'ISSUED',
      quotation.material_cost,
      quotation.transport_cost,
      quotation.loading_cost,
      quotation.platform_fee,
      quotation.discount,
      quotation.final_delivered_price,
      quotation.estimated_gross_margin,
      quotation.validity_date,
      quotation.notes ?? null,
      quotation.created_by_user_id,
      quotation.created_at,
    ]);
    if (res instanceof Promise) return res.then(() => {});
  }

  findByOrderId(orderId: string): Promise<Quotation[]> | Quotation[] {
    return dbAdapter.all<Quotation>(
      'SELECT * FROM quotations WHERE order_id = ? ORDER BY version DESC, created_at DESC',
      [orderId]
    );
  }

  findById(id: string): Promise<Quotation | null> | (Quotation | null) {
    return dbAdapter.get<Quotation>('SELECT * FROM quotations WHERE id = ?', [id]);
  }

  getLatestVersion(orderId: string): Promise<number> | number {
    const res = dbAdapter.get<{ max_version: number }>(
      'SELECT COALESCE(MAX(version), 0) as max_version FROM quotations WHERE order_id = ?',
      [orderId]
    );
    if (res instanceof Promise) {
      return res.then((r) => r?.max_version ?? 0);
    }
    return res?.max_version ?? 0;
  }

  updateStatus(id: string, status: QuotationStatus): Promise<void> | void {
    const res = dbAdapter.run('UPDATE quotations SET quotation_status = ? WHERE id = ?', [status, id]);
    if (res instanceof Promise) return res.then(() => {});
  }

  markPreviousQuotationsSuperseded(orderId: string): Promise<void> | void {
    const res = dbAdapter.run(
      "UPDATE quotations SET quotation_status = 'SUPERSEDED' WHERE order_id = ? AND quotation_status IN ('ISSUED', 'DRAFT')",
      [orderId]
    );
    if (res instanceof Promise) return res.then(() => {});
  }
}
