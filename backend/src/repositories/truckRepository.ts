import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../db/connection.js';
import { Truck } from '../models/index.js';

export interface TruckWithDriver extends Truck {
  default_driver_name?: string;
  default_driver_mobile?: string;
}

export class TruckRepository {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db ?? getDatabase();
  }

  create(truck: Truck): void {
    const stmt = this.db.prepare(`
      INSERT INTO trucks (
        id, registration_number, capacity_tons, supported_materials,
        owner_name, owner_mobile, default_driver_id,
        availability_status, indicative_transport_rate, verification_status,
        notes, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
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
      truck.updated_at
    );
  }

  update(id: string, updates: Partial<Truck>): Truck | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const merged: Truck = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const stmt = this.db.prepare(`
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
    `);

    stmt.run(
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
      id
    );

    return merged;
  }

  findAll(options: { activeOnly?: boolean } = {}): TruckWithDriver[] {
    let query = `
      SELECT t.*, d.full_name as default_driver_name, d.mobile_number as default_driver_mobile
      FROM trucks t
      LEFT JOIN drivers d ON t.default_driver_id = d.id
    `;
    if (options.activeOnly) {
      query += ' WHERE t.is_active = 1';
    }
    query += ' ORDER BY t.created_at DESC';
    const stmt = this.db.prepare(query);
    return (stmt.all() as unknown as TruckWithDriver[]) || [];
  }

  findById(id: string): Truck | null {
    const stmt = this.db.prepare('SELECT * FROM trucks WHERE id = ?');
    const result = stmt.get(id);
    return (result as unknown as Truck) || null;
  }
}
