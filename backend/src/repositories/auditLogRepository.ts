import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../db/connection.js';
import { AuditLog } from '../models/index.js';

export class AuditLogRepository {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db ?? getDatabase();
  }

  create(log: AuditLog): void {
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, changes_json, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      log.id,
      log.user_id ?? null,
      log.action,
      log.entity_type,
      log.entity_id,
      log.changes_json ?? null,
      log.ip_address ?? null,
      log.created_at
    );
  }

  findByEntity(entityType: string, entityId: string): AuditLog[] {
    const stmt = this.db.prepare('SELECT * FROM audit_logs WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC');
    return (stmt.all(entityType, entityId) as unknown as AuditLog[]) || [];
  }
}
