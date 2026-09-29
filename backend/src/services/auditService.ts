import { AuditLogRepository } from '../repositories/auditLogRepository.js';
import { AuditLog } from '../models/index.js';
import { Logger } from '../utils/logger.js';

export interface AuditActionParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
}

export class AuditService {
  private auditRepo: AuditLogRepository;

  constructor(auditRepo?: AuditLogRepository) {
    this.auditRepo = auditRepo ?? new AuditLogRepository();
  }

  async recordAction(params: AuditActionParams): Promise<void> {
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      user_id: params.userId ?? null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      changes_json: params.changes ? JSON.stringify(params.changes) : null,
      ip_address: params.ipAddress ?? null,
      created_at: new Date().toISOString(),
    };

    await this.auditRepo.create(log);
    Logger.info(`Audit logged: ${params.action} on ${params.entityType}:${params.entityId} by ${params.userId ?? 'SYSTEM'}`);
  }

  log(params: AuditActionParams): void {
    void this.recordAction(params);
  }

  async getAuditTrail(entityType: string, entityId: string): Promise<AuditLog[]> {
    return (await this.auditRepo.findByEntity(entityType, entityId)) as AuditLog[];
  }
}
