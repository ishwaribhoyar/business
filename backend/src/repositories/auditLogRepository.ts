import { dbAdapter } from '../db/dbAdapter.js';
import { AuditLog } from '../models/index.js';

export class AuditLogRepository {
  create(log: AuditLog): Promise<void> | void {
    const res = dbAdapter.run(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, changes_json, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      log.id,
      log.user_id ?? null,
      log.action,
      log.entity_type,
      log.entity_id,
      log.changes_json ?? null,
      log.ip_address ?? null,
      log.created_at,
    ]);
    if (res instanceof Promise) return res.then(() => {});
  }

  findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> | AuditLog[] {
    return dbAdapter.all<AuditLog>(
      'SELECT * FROM audit_logs WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC',
      [entityType, entityId]
    );
  }

  findAll(limit = 50, offset = 0): Promise<{ logs: AuditLog[]; total: number }> | { logs: AuditLog[]; total: number } {
    if (dbAdapter.isPostgres) {
      return (async () => {
        const countRes = await dbAdapter.get<{ total: number | string }>('SELECT COUNT(*) as total FROM audit_logs');
        const logs = await dbAdapter.all<AuditLog>(
          'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
          [limit, offset]
        );
        return {
          logs,
          total: Number(countRes?.total || 0),
        };
      })();
    }

    const countResult = dbAdapter.get<{ total: number }>('SELECT COUNT(*) as total FROM audit_logs') as { total: number } | null;
    const logs = dbAdapter.all<AuditLog>(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    ) as AuditLog[];

    return {
      logs,
      total: Number(countResult?.total || 0),
    };
  }
}
