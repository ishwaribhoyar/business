import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../db/connection.js';
import { Quotation } from '../models/index.js';

export class QuotationRepository {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db ?? getDatabase();
  }

  create(quotation: Quotation): void {
    const stmt = this.db.prepare(`
      INSERT INTO quotations (
        id, quotation_reference, order_id, material_cost, transport_cost,
        loading_cost, platform_fee, discount, final_delivered_price,
        estimated_gross_margin, validity_date, notes, created_by_user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      quotation.id,
      quotation.quotation_reference,
      quotation.order_id,
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
      quotation.created_at
    );
  }

  findByOrderId(orderId: string): Quotation[] {
    const stmt = this.db.prepare('SELECT * FROM quotations WHERE order_id = ? ORDER BY created_at DESC');
    return (stmt.all(orderId) as unknown as Quotation[]) || [];
  }

  findById(id: string): Quotation | null {
    const stmt = this.db.prepare('SELECT * FROM quotations WHERE id = ?');
    const result = stmt.get(id);
    return (result as unknown as Quotation) || null;
  }
}
