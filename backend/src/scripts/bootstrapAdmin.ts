import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';
import { isPostgresConfigured } from '../db/connection.js';
import { getPgPool } from '../db/pgPool.js';
import { getDatabase } from '../db/connection.js';
import { Logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);

export interface BootstrapAdminOptions {
  email?: string;
  password?: string;
  fullName?: string;
}

/**
 * Bootstraps the initial SUPER_ADMIN account in PostgreSQL or SQLite if not already present
 */
export async function bootstrapAdminUser(options?: BootstrapAdminOptions): Promise<{ created: boolean; email: string }> {
  const email = (options?.email || process.env.BOOTSTRAP_ADMIN_EMAIL || config.initialAdmin.email).toLowerCase().trim();
  const password = options?.password || process.env.BOOTSTRAP_ADMIN_PASSWORD || config.initialAdmin.password;
  const fullName = options?.fullName || process.env.BOOTSTRAP_ADMIN_NAME || config.initialAdmin.name;

  if (!email || !password) {
    throw new Error('Bootstrap email and password are required.');
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  const now = new Date().toISOString();
  const id = `usr_super_${Date.now()}`;

  if (isPostgresConfigured()) {
    const pool = getPgPool();
    // Check if user already exists
    const checkRes = await pool.query('SELECT id, email, role FROM admin_users WHERE email = $1', [email]);
    if (checkRes.rows.length > 0) {
      Logger.info(`Bootstrap: Admin user '${email}' already exists in PostgreSQL (Role: ${checkRes.rows[0].role}).`);
      return { created: false, email };
    }

    // Insert new Super Admin (concurrency-safe: ON CONFLICT DO NOTHING)
    const insertRes = await pool.query(
      `INSERT INTO admin_users (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'SUPER_ADMIN', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (email) DO NOTHING`,
      [id, email, passwordHash, fullName]
    );

    if ((insertRes.rowCount ?? 0) === 0) {
      Logger.info(`Bootstrap: Admin user '${email}' already existed upon concurrent insert.`);
      return { created: false, email };
    }

    Logger.info(`Bootstrap: Created initial SUPER_ADMIN '${email}' in PostgreSQL.`);
    return { created: true, email };
  } else {
    // SQLite Fallback for local development/test
    const db = getDatabase();
    const existing = db.prepare('SELECT id, email, role FROM admin_users WHERE email = ?').get(email) as any;
    if (existing) {
      Logger.info(`Bootstrap: Admin user '${email}' already exists in SQLite (Role: ${existing.role}).`);
      return { created: false, email };
    }

    const info = db.prepare(`
      INSERT OR IGNORE INTO admin_users (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'SUPER_ADMIN', 1, ?, ?)
    `).run(id, email, passwordHash, fullName, now, now);

    if (info.changes === 0) {
      Logger.info(`Bootstrap: Admin user '${email}' already existed upon concurrent insert.`);
      return { created: false, email };
    }

    Logger.info(`Bootstrap: Created initial SUPER_ADMIN '${email}' in SQLite.`);
    return { created: true, email };
  }
}

// Allow CLI execution: tsx src/scripts/bootstrapAdmin.ts
if (process.argv[1] === __filename) {
  bootstrapAdminUser()
    .then((res) => {
      console.log(`Admin Bootstrap Finished: [Created: ${res.created}, Email: ${res.email}]`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Admin Bootstrap Failed:', err);
      process.exit(1);
    });
}
