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

  update(id: string, updates: Partial<Driver>): Driver | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const merged: Driver = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const stmt = this.db.prepare(`
      UPDATE drivers SET
        full_name = ?,
        mobile_number = ?,
        license_number = ?,
        verification_status = ?,
        availability_status = ?,
        notes = ?,
        is_active = ?,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      merged.full_name,
      merged.mobile_number,
      merged.license_number ?? null,
      merged.verification_status,
      merged.availability_status,
      merged.notes ?? null,
      merged.is_active,
      merged.updated_at,
      id
    );

    return merged;
  }

  findAll(options: { activeOnly?: boolean } = {}): Driver[] {
    let query = 'SELECT * FROM drivers';
    if (options.activeOnly) {
      query += ' WHERE is_active = 1';
    }
    query += ' ORDER BY created_at DESC';
    const stmt = this.db.prepare(query);
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
