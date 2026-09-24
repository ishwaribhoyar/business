import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../db/connection.js';
import { Supplier } from '../models/index.js';

export class SupplierRepository {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db ?? getDatabase();
  }

  create(supplier: Supplier): void {
    const stmt = this.db.prepare(`
      INSERT INTO suppliers (
        id, business_name, contact_person, mobile_number, location_address,
        service_zones, supported_materials, verification_status, indicative_purchase_price,
        price_updated_at, quality_notes, fulfillment_notes, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      supplier.id,
      supplier.business_name,
      supplier.contact_person,
      supplier.mobile_number,
      supplier.location_address,
      supplier.service_zones,
      supplier.supported_materials,
      supplier.verification_status,
      supplier.indicative_purchase_price ?? null,
      supplier.price_updated_at ?? null,
      supplier.quality_notes ?? null,
      supplier.fulfillment_notes ?? null,
      supplier.is_active,
      supplier.created_at,
      supplier.updated_at
    );
  }

  findAll(): Supplier[] {
    const stmt = this.db.prepare('SELECT * FROM suppliers ORDER BY created_at DESC');
    return (stmt.all() as unknown as Supplier[]) || [];
  }

  findById(id: string): Supplier | null {
    const stmt = this.db.prepare('SELECT * FROM suppliers WHERE id = ?');
    const result = stmt.get(id);
    return (result as unknown as Supplier) || null;
  }
}
