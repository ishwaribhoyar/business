import { dbAdapter } from '../db/dbAdapter.js';
import { Customer } from '../models/index.js';

export class CustomerRepository {
  findByMobile(mobileNumber: string): Promise<Customer | null> | (Customer | null) {
    return dbAdapter.get<Customer>('SELECT * FROM customers WHERE mobile_number = ?', [mobileNumber]);
  }

  findById(id: string): Promise<Customer | null> | (Customer | null) {
    return dbAdapter.get<Customer>('SELECT * FROM customers WHERE id = ?', [id]);
  }

  create(customer: Customer): Promise<void> | void {
    const res = dbAdapter.run(`
      INSERT INTO customers (
        id, full_name, mobile_number, whatsapp_number, delivery_address,
        area_pincode, map_pin_url, internal_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customer.id,
      customer.full_name,
      customer.mobile_number,
      customer.whatsapp_number ?? null,
      customer.delivery_address,
      customer.area_pincode,
      customer.map_pin_url ?? null,
      customer.internal_notes ?? null,
      customer.created_at,
      customer.updated_at,
    ]);
    if (res instanceof Promise) return res.then(() => {});
  }

  findAll(limit = 50, offset = 0): Promise<{ customers: Customer[]; total: number }> | { customers: Customer[]; total: number } {
    if (dbAdapter.isPostgres) {
      return (async () => {
        const countRes = await dbAdapter.get<{ total: number | string }>('SELECT COUNT(*) as total FROM customers');
        const customers = await dbAdapter.all<Customer>(
          'SELECT * FROM customers ORDER BY created_at DESC LIMIT ? OFFSET ?',
          [limit, offset]
        );
        return {
          customers,
          total: Number(countRes?.total || 0),
        };
      })();
    }

    const countResult = dbAdapter.get<{ total: number }>('SELECT COUNT(*) as total FROM customers') as { total: number } | null;
    const customers = dbAdapter.all<Customer>(
      'SELECT * FROM customers ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    ) as Customer[];

    return {
      customers,
      total: Number(countResult?.total || 0),
    };
  }
}
