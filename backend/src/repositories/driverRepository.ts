import { dbAdapter } from '../db/dbAdapter.js';
import { Driver } from '../models/index.js';

export class DriverRepository {
  create(driver: Driver): Promise<void> | void {
    const res = dbAdapter.run(`
      INSERT INTO drivers (
        id, full_name, mobile_number, license_number,
        verification_status, availability_status, notes,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      driver.id,
      driver.full_name,
      driver.mobile_number,
      driver.license_number ?? null,
      driver.verification_status,
      driver.availability_status,
      driver.notes ?? null,
      driver.is_active,
      driver.created_at,
      driver.updated_at,
    ]);
    if (res instanceof Promise) return res.then(() => {});
  }

  update(id: string, updates: Partial<Driver>): Promise<Driver | null> | (Driver | null) {
    if (dbAdapter.isPostgres) {
      return (async () => {
        const existing = await this.findById(id);
        if (!existing) return null;

        const merged: Driver = {
          ...existing,
          ...updates,
          updated_at: new Date().toISOString(),
        };

        await dbAdapter.run(`
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
        `, [
          merged.full_name,
          merged.mobile_number,
          merged.license_number ?? null,
          merged.verification_status,
          merged.availability_status,
          merged.notes ?? null,
          merged.is_active,
          merged.updated_at,
          id,
        ]);

        return merged;
      })();
    }

    const existing = this.findById(id) as Driver | null;
    if (!existing) return null;

    const merged: Driver = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    dbAdapter.run(`
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
    `, [
      merged.full_name,
      merged.mobile_number,
      merged.license_number ?? null,
      merged.verification_status,
      merged.availability_status,
      merged.notes ?? null,
      merged.is_active,
      merged.updated_at,
      id,
    ]);

    return merged;
  }

  findAll(options: { activeOnly?: boolean } = {}): Promise<Driver[]> | Driver[] {
    let query = 'SELECT * FROM drivers';
    if (options.activeOnly) {
      query += ' WHERE is_active = 1';
    }
    query += ' ORDER BY created_at DESC';
    return dbAdapter.all<Driver>(query);
  }

  findById(id: string): Promise<Driver | null> | (Driver | null) {
    return dbAdapter.get<Driver>('SELECT * FROM drivers WHERE id = ?', [id]);
  }

  findByMobile(mobileNumber: string): Promise<Driver | null> | (Driver | null) {
    return dbAdapter.get<Driver>('SELECT * FROM drivers WHERE mobile_number = ?', [mobileNumber]);
  }
}
