import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../db/connection.js';
import { Truck } from '../models/index.js';

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

  findAll(): Truck[] {
    const stmt = this.db.prepare('SELECT * FROM trucks ORDER BY created_at DESC');
    return (stmt.all() as unknown as Truck[]) || [];
  }

  findById(id: string): Truck | null {
    const stmt = this.db.prepare('SELECT * FROM trucks WHERE id = ?');
    const result = stmt.get(id);
    return (result as unknown as Truck) || null;
  }
}
