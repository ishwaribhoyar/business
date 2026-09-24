import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../db/connection.js';
import { Customer } from '../models/index.js';

export class CustomerRepository {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db ?? getDatabase();
  }

  findByMobile(mobileNumber: string): Customer | null {
    const stmt = this.db.prepare('SELECT * FROM customers WHERE mobile_number = ?');
    const result = stmt.get(mobileNumber);
    return (result as unknown as Customer) || null;
  }

  findById(id: string): Customer | null {
    const stmt = this.db.prepare('SELECT * FROM customers WHERE id = ?');
    const result = stmt.get(id);
    return (result as unknown as Customer) || null;
  }

  create(customer: Customer): void {
    const stmt = this.db.prepare(`
      INSERT INTO customers (
        id, full_name, mobile_number, whatsapp_number, delivery_address,
        area_pincode, map_pin_url, internal_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      customer.id,
      customer.full_name,
      customer.mobile_number,
      customer.whatsapp_number ?? null,
      customer.delivery_address,
      customer.area_pincode,
      customer.map_pin_url ?? null,
      customer.internal_notes ?? null,
      customer.created_at,
      customer.updated_at
    );
  }

  findAll(limit = 50, offset = 0): { customers: Customer[]; total: number } {
    const countStmt = this.db.prepare('SELECT COUNT(*) as total FROM customers');
    const countResult = countStmt.get() as { total: number };

    const stmt = this.db.prepare('SELECT * FROM customers ORDER BY created_at DESC LIMIT ? OFFSET ?');
    const customers = stmt.all(limit, offset) as unknown as Customer[];

    return {
      customers,
      total: countResult.total,
    };
  }
}
