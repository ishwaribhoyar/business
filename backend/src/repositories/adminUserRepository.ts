import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../db/connection.js';
import { AdminUser } from '../models/index.js';

export class AdminUserRepository {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db ?? getDatabase();
  }

  findByEmail(email: string): AdminUser | null {
    const stmt = this.db.prepare('SELECT * FROM admin_users WHERE email = ?');
    const result = stmt.get(email.toLowerCase().trim());
    return (result as unknown as AdminUser) || null;
  }

  findById(id: string): AdminUser | null {
    const stmt = this.db.prepare('SELECT * FROM admin_users WHERE id = ?');
    const result = stmt.get(id);
    return (result as unknown as AdminUser) || null;
  }

  findAll(): AdminUser[] {
    const stmt = this.db.prepare('SELECT * FROM admin_users ORDER BY created_at DESC');
    return (stmt.all() as unknown as AdminUser[]) || [];
  }

  updateLastLogin(id: string, timestamp: string): void {
    const stmt = this.db.prepare('UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE id = ?');
    stmt.run(timestamp, timestamp, id);
  }

  updateStatus(id: string, isActive: number, updatedAt: string): void {
    const stmt = this.db.prepare('UPDATE admin_users SET is_active = ?, updated_at = ? WHERE id = ?');
    stmt.run(isActive, updatedAt, id);
  }

  create(user: AdminUser): void {
    const stmt = this.db.prepare(`
      INSERT INTO admin_users (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      user.id,
      user.email,
      user.password_hash,
      user.full_name,
      user.role,
      user.is_active,
      user.created_at,
      user.updated_at
    );
  }
}
