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

  update(id: string, updates: Partial<Supplier>): Supplier | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const merged: Supplier = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const stmt = this.db.prepare(`
      UPDATE suppliers SET
        business_name = ?,
        contact_person = ?,
        mobile_number = ?,
        location_address = ?,
        service_zones = ?,
        supported_materials = ?,
        verification_status = ?,
        indicative_purchase_price = ?,
        price_updated_at = ?,
        quality_notes = ?,
        fulfillment_notes = ?,
        is_active = ?,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      merged.business_name,
      merged.contact_person,
      merged.mobile_number,
      merged.location_address,
      merged.service_zones,
      merged.supported_materials,
      merged.verification_status,
      merged.indicative_purchase_price ?? null,
      merged.price_updated_at ?? null,
      merged.quality_notes ?? null,
      merged.fulfillment_notes ?? null,
      merged.is_active,
      merged.updated_at,
      id
    );

    return merged;
  }

  findAll(options: { activeOnly?: boolean } = {}): Supplier[] {
    let query = 'SELECT * FROM suppliers';
    if (options.activeOnly) {
      query += ' WHERE is_active = 1';
    }
    query += ' ORDER BY created_at DESC';
    const stmt = this.db.prepare(query);
    return (stmt.all() as unknown as Supplier[]) || [];
  }

  findById(id: string): Supplier | null {
    const stmt = this.db.prepare('SELECT * FROM suppliers WHERE id = ?');
    const result = stmt.get(id);
    return (result as unknown as Supplier) || null;
  }
}
