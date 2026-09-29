import { dbAdapter } from '../db/dbAdapter.js';
import { AdminUser } from '../models/index.js';

export class AdminUserRepository {
  findByEmail(email: string): Promise<AdminUser | null> | (AdminUser | null) {
    return dbAdapter.get<AdminUser>('SELECT * FROM admin_users WHERE email = ?', [email.toLowerCase().trim()]);
  }

  findById(id: string): Promise<AdminUser | null> | (AdminUser | null) {
    return dbAdapter.get<AdminUser>('SELECT * FROM admin_users WHERE id = ?', [id]);
  }

  findAll(): Promise<AdminUser[]> | AdminUser[] {
    return dbAdapter.all<AdminUser>('SELECT * FROM admin_users ORDER BY created_at DESC');
  }

  updateLastLogin(id: string, timestamp: string): Promise<void> | void {
    const res = dbAdapter.run('UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE id = ?', [timestamp, timestamp, id]);
    if (res instanceof Promise) return res.then(() => {});
  }

  updateStatus(id: string, isActive: number | boolean, updatedAt: string): Promise<void> | void {
    const boolVal = typeof isActive === 'boolean' ? (isActive ? 1 : 0) : isActive;
    const res = dbAdapter.run('UPDATE admin_users SET is_active = ?, updated_at = ? WHERE id = ?', [boolVal, updatedAt, id]);
    if (res instanceof Promise) return res.then(() => {});
  }

  create(user: AdminUser): Promise<void> | void {
    const res = dbAdapter.run(`
      INSERT INTO admin_users (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user.id,
      user.email,
      user.password_hash,
      user.full_name,
      user.role,
      user.is_active,
      user.created_at,
      user.updated_at,
    ]);
    if (res instanceof Promise) return res.then(() => {});
  }
}
