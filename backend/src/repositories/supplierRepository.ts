import { dbAdapter } from '../db/dbAdapter.js';
import { Supplier } from '../models/index.js';

export class SupplierRepository {
  create(supplier: Supplier): Promise<void> | void {
    const res = dbAdapter.run(`
      INSERT INTO suppliers (
        id, business_name, contact_person, mobile_number, location_address,
        service_zones, supported_materials, verification_status, indicative_purchase_price,
        price_updated_at, quality_notes, fulfillment_notes, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
      supplier.updated_at,
    ]);
    if (res instanceof Promise) return res.then(() => {});
  }

  update(id: string, updates: Partial<Supplier>): Promise<Supplier | null> | (Supplier | null) {
    const existing = this.findById(id);
    if (existing instanceof Promise) {
      return existing.then((ex) => {
        if (!ex) return null;
        const merged: Supplier = {
          ...ex,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        const res = dbAdapter.run(`
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
        `, [
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
          id,
        ]);
        if (res instanceof Promise) return res.then(() => merged);
        return merged;
      });
    }

    if (!existing) return null;
    const merged: Supplier = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    dbAdapter.run(`
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
    `, [
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
      id,
    ]);
    return merged;
  }

  findAll(options: { activeOnly?: boolean } = {}): Promise<Supplier[]> | Supplier[] {
    let query = 'SELECT * FROM suppliers';
    if (options.activeOnly) {
      query += ' WHERE is_active = 1';
    }
    query += ' ORDER BY created_at DESC';
    return dbAdapter.all<Supplier>(query);
  }

  findById(id: string): Promise<Supplier | null> | (Supplier | null) {
    return dbAdapter.get<Supplier>('SELECT * FROM suppliers WHERE id = ?', [id]);
  }
}
