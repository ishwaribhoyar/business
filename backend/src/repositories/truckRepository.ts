import { dbAdapter } from '../db/dbAdapter.js';
import { Truck } from '../models/index.js';

export interface TruckWithDriver extends Truck {
  default_driver_name?: string;
  default_driver_mobile?: string;
}

export class TruckRepository {
  create(truck: Truck): Promise<void> | void {
    const res = dbAdapter.run(`
      INSERT INTO trucks (
        id, registration_number, capacity_tons, supported_materials,
        owner_name, owner_mobile, default_driver_id,
        availability_status, indicative_transport_rate, verification_status,
        notes, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      truck.id,
      truck.registration_number,
      truck.capacity_tons,
      truck.supported_materials,
      truck.owner_name,
      truck.owner_mobile,
      truck.default_driver_id ?? null,
      truck.availability_status,
      truck.indicative_transport_rate ?? null,
      truck.verification_status,
      truck.notes ?? null,
      truck.is_active,
      truck.created_at,
      truck.updated_at,
    ]);
    if (res instanceof Promise) return res.then(() => {});
  }

  update(id: string, updates: Partial<Truck>): Promise<Truck | null> | (Truck | null) {
    const existing = this.findById(id);
    if (existing instanceof Promise) {
      return existing.then((ex) => {
        if (!ex) return null;
        const merged: Truck = {
          ...ex,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        const res = dbAdapter.run(`
          UPDATE trucks SET
            registration_number = ?,
            capacity_tons = ?,
            supported_materials = ?,
            owner_name = ?,
            owner_mobile = ?,
            default_driver_id = ?,
            availability_status = ?,
            indicative_transport_rate = ?,
            verification_status = ?,
            notes = ?,
            is_active = ?,
            updated_at = ?
          WHERE id = ?
        `, [
          merged.registration_number,
          merged.capacity_tons,
          merged.supported_materials,
          merged.owner_name,
          merged.owner_mobile,
          merged.default_driver_id ?? null,
          merged.availability_status,
          merged.indicative_transport_rate ?? null,
          merged.verification_status,
          merged.notes ?? null,
          merged.is_active,
          merged.updated_at,
          id,
        ]);
        if (res instanceof Promise) return res.then(() => merged);
        return merged;
      });
    }

    if (!existing) return null;
    const merged: Truck = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    dbAdapter.run(`
      UPDATE trucks SET
        registration_number = ?,
        capacity_tons = ?,
        supported_materials = ?,
        owner_name = ?,
        owner_mobile = ?,
        default_driver_id = ?,
        availability_status = ?,
        indicative_transport_rate = ?,
        verification_status = ?,
        notes = ?,
        is_active = ?,
        updated_at = ?
      WHERE id = ?
    `, [
      merged.registration_number,
      merged.capacity_tons,
      merged.supported_materials,
      merged.owner_name,
      merged.owner_mobile,
      merged.default_driver_id ?? null,
      merged.availability_status,
      merged.indicative_transport_rate ?? null,
      merged.verification_status,
      merged.notes ?? null,
      merged.is_active,
      merged.updated_at,
      id,
    ]);
    return merged;
  }

  findAll(options: { activeOnly?: boolean } = {}): Promise<TruckWithDriver[]> | TruckWithDriver[] {
    let query = `
      SELECT t.*, d.full_name as default_driver_name, d.mobile_number as default_driver_mobile
      FROM trucks t
      LEFT JOIN drivers d ON t.default_driver_id = d.id
    `;
    if (options.activeOnly) {
      query += ' WHERE t.is_active = 1';
    }
    query += ' ORDER BY t.created_at DESC';
    return dbAdapter.all<TruckWithDriver>(query);
  }

  findById(id: string): Promise<Truck | null> | (Truck | null) {
    return dbAdapter.get<Truck>('SELECT * FROM trucks WHERE id = ?', [id]);
  }
}
