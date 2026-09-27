import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../db/connection.js';
import { Driver } from '../models/index.js';

export class DriverRepository {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db ?? getDatabase();
  }

  create(driver: Driver): void {
    const stmt = this.db.prepare(`
      INSERT INTO drivers (
        id, full_name, mobile_number, license_number,
        verification_status, availability_status, notes,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      driver.id,
      driver.full_name,
      driver.mobile_number,
      driver.license_number ?? null,
      driver.verification_status,
      driver.availability_status,
      driver.notes ?? null,
      driver.is_active,
      driver.created_at,
      driver.updated_at
    );
  }

  findAll(): Driver[] {
    const stmt = this.db.prepare('SELECT * FROM drivers ORDER BY created_at DESC');
    return (stmt.all() as unknown as Driver[]) || [];
  }

  findById(id: string): Driver | null {
    const stmt = this.db.prepare('SELECT * FROM drivers WHERE id = ?');
    const result = stmt.get(id);
    return (result as unknown as Driver) || null;
  }

  findByMobile(mobileNumber: string): Driver | null {
    const stmt = this.db.prepare('SELECT * FROM drivers WHERE mobile_number = ?');
    const result = stmt.get(mobileNumber);
    return (result as unknown as Driver) || null;
  }
}
