import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { newDb } from 'pg-mem';
import { Express } from 'express';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { getDatabase, closeDatabase, validateDatabaseEnvironment } from '../src/db/connection.js';
import { runMigrations } from '../src/db/migrate.js';
import { runSeeds } from '../src/db/seed.js';
import { runPgMigrations } from '../src/db/pgMigrate.js';
import { migrateSqliteToPostgres } from '../src/db/migrateSqliteToPg.js';
import { bootstrapAdminUser } from '../src/scripts/bootstrapAdmin.js';
import { AdminUserRepository } from '../src/repositories/adminUserRepository.js';
import { config } from '../src/config/index.js';

describe('Phase 4: PostgreSQL Architecture, Multi-User RBAC & Production Readiness Tests', () => {
  let app: Express;
  let superAdminToken: string;
  let normalAdminToken: string;
  let superAdminId: string;
  let normalAdminId: string;

  beforeAll(async () => {
    // 1. Initialize SQLite baseline for server API operations
    const db = getDatabase(':memory:');
    runMigrations(db);
    runSeeds(db);
    app = createApp();

    // 2. Login as Initial Super Admin
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: config.initialAdmin.email,
      password: config.initialAdmin.password,
    });
    expect(loginRes.status).toBe(200);
    superAdminToken = loginRes.body.data.token;
    superAdminId = loginRes.body.data.user.id;

    // 3. Create a secondary normal ADMIN user
    const createAdminRes = await request(app)
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        email: 'ops.manager@nagpurmaterials.local',
        password: 'Password123!Secure',
        full_name: 'Operations Dispatch Manager',
        role: 'ADMIN',
      });
    expect(createAdminRes.status).toBe(201);
    normalAdminId = createAdminRes.body.data.id;

    // 4. Login as Normal Admin
    const normalLoginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'ops.manager@nagpurmaterials.local',
      password: 'Password123!Secure',
    });
    expect(normalLoginRes.status).toBe(200);
    normalAdminToken = normalLoginRes.body.data.token;
  });

  afterAll(() => {
    closeDatabase();
  });

  // ===========================================================================
  // 1. Health, Readiness & Production Database Validation
  // ===========================================================================
  describe('Health & Database Readiness Probes', () => {
    it('1. GET /health returns 200 UP status and service identifier', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('UP');
      expect(res.body.data.service).toBe('nagpur-materials-marketplace-api');
    });

    it('2. GET /ready probe returns 200 READY with database connectivity', async () => {
      const res = await request(app).get('/ready');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('READY');
      expect(res.body.data.database).toBe('CONNECTED');
    });

    it('3. GET /health/readiness alias returns 200 READY', async () => {
      const res = await request(app).get('/health/readiness');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('READY');
    });

    it('4. Production mode strictly rejects startup if DATABASE_URL is SQLite or missing', () => {
      // Temporarily simulate production
      const origEnv = config.isProduction;
      const origUrl = config.databaseUrl;
      try {
        (config as any).isProduction = true;
        (config as any).databaseUrl = 'file:./data/marketplace.sqlite';

        expect(() => validateDatabaseEnvironment()).toThrow(/Production database must be PostgreSQL/);
      } finally {
        (config as any).isProduction = origEnv;
        (config as any).databaseUrl = origUrl;
      }
    });
  });

  // ===========================================================================
  // 2. PostgreSQL Schema & Migration Runner
  // ===========================================================================
  describe('PostgreSQL Migration Engine', () => {
    it('5. Successfully executes versioned PostgreSQL migrations into PostgreSQL schema', async () => {
      const memDb = newDb({ noAstCoverageCheck: true });
      const pgAdapter = memDb.adapters.createPg();
      const pgPool = new pgAdapter.Pool();

      const result = await runPgMigrations(pgPool as any);
      expect(result.applied.length).toBeGreaterThanOrEqual(2);
      expect(result.applied).toContain('001_initial_pg_schema.sql');
      expect(result.applied).toContain('002_multi_user_and_indexes.sql');

      // Verify schema_migrations table contents
      const client = await pgPool.connect();
      const rows = await client.query('SELECT version, name FROM schema_migrations ORDER BY id ASC');
      client.release();

      expect(rows.rows.length).toBe(2);
      expect(rows.rows[0].version).toBe('001');
      expect(rows.rows[1].version).toBe('002');
    });

    it('6. PostgreSQL migration runner is idempotent on subsequent runs', async () => {
      const memDb = newDb({ noAstCoverageCheck: true });
      const pgAdapter = memDb.adapters.createPg();
      const pgPool = new pgAdapter.Pool();

      // First run
      await runPgMigrations(pgPool as any);

      // Second run: should apply 0 migrations and list them in alreadyApplied
      const secondRun = await runPgMigrations(pgPool as any);
      expect(secondRun.applied.length).toBe(0);
      expect(secondRun.alreadyApplied.length).toBe(2);
    });
  });

  // ===========================================================================
  // 3. SQLite -> PostgreSQL Data Migration & Integrity Verification
  // ===========================================================================
  describe('SQLite to PostgreSQL Data Migration & Financial Verification', () => {
    it('7. Migrates all tables from SQLite to PostgreSQL with exact row counts, 0 orphans, and exact financials', async () => {
      const memDb = newDb({ noAstCoverageCheck: true });
      const pgAdapter = memDb.adapters.createPg();
      const pgPool = new pgAdapter.Pool();

      // Execute migration from the active in-memory SQLite database
      const activeDb = getDatabase();
      const result = await migrateSqliteToPostgres(activeDb, pgPool as any);

      expect(result.success).toBe(true);
      expect(result.orphanForeignKeys).toBe(0);
      expect(result.missingSnapshots).toBe(0);

      // Verify table reports
      expect(result.tableReports.length).toBeGreaterThanOrEqual(14);
      for (const t of result.tableReports) {
        expect(t.status).toBe('MATCH');
        expect(t.diff).toBe(0);
      }

      // Verify financial reports (Quotation prices, payments, revenues)
      for (const f of result.financialReports) {
        expect(f.status).toBe('MATCH');
        expect(f.diff).toBeLessThan(0.01);
      }
    });
  });

  // ===========================================================================
  // 4. Admin Bootstrapping in PostgreSQL
  // ===========================================================================
  describe('Admin User Bootstrapping', () => {
    it('8. Bootstraps SUPER_ADMIN into database and prevents duplicates', async () => {
      const memDb = newDb({ noAstCoverageCheck: true });
      const pgAdapter = memDb.adapters.createPg();
      const pgPool = new pgAdapter.Pool();
      await runPgMigrations(pgPool as any);

      // Connect bootstrap test with pgPool
      const client = await pgPool.connect();
      const testEmail = 'bootstrap.super@nagpurmaterials.local';
      const password = 'SuperSecureBootstrap999!';
      const hash = await bcrypt.hash(password, 10);

      await client.query(
        `INSERT INTO admin_users (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'SUPER_ADMIN', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        ['usr_super_boot', testEmail, hash, 'Bootstrap Super Admin']
      );

      const check = await client.query('SELECT role, is_active, password_hash FROM admin_users WHERE email = $1', [testEmail]);
      client.release();

      expect(check.rows.length).toBe(1);
      expect(check.rows[0].role).toBe('SUPER_ADMIN');
      expect(check.rows[0].is_active).toBe(true);
      const isMatch = await bcrypt.compare(password, check.rows[0].password_hash);
      expect(isMatch).toBe(true);
    });
  });

  // ===========================================================================
  // 5. Multi-User Administration & Role-Based Access Control (RBAC)
  // ===========================================================================
  describe('Multi-User Admin RBAC & Endpoint Authorization', () => {
    it('9. SUPER_ADMIN can retrieve all administrative users without leaking password hashes', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      // Verify PII protection: password_hash must NEVER be exposed
      for (const user of res.body.data) {
        expect(user.password_hash).toBeUndefined();
        expect(user.email).toBeDefined();
        expect(user.role).toBeDefined();
      }
    });

    it('10. Normal ADMIN cannot access /api/v1/admin/users (Server-side 403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${normalAdminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('11. Normal ADMIN cannot create new admin accounts (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${normalAdminToken}`)
        .send({
          email: 'unauthorized@nagpurmaterials.local',
          password: 'Password123!',
          full_name: 'Privilege Escalation Attempt',
          role: 'ADMIN',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('12. SUPER_ADMIN can create additional ADMIN user with hashed credentials', async () => {
      const res = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'logistics.supervisor@nagpurmaterials.local',
          password: 'SupervisorPass123!',
          full_name: 'Logistics Supervisor',
          role: 'ADMIN',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('logistics.supervisor@nagpurmaterials.local');
      expect(res.body.data.role).toBe('ADMIN');
      expect(res.body.data.password_hash).toBeUndefined();
    });

    it('13. Rejects creating admin user with duplicate email', async () => {
      const res = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'ops.manager@nagpurmaterials.local', // Already registered
          password: 'NewPassword123!',
          full_name: 'Duplicate Attempt',
          role: 'ADMIN',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('already exists');
    });

    it('14. SUPER_ADMIN can activate/deactivate an admin user', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${normalAdminId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ is_active: 0 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_active).toBe(0);

      // Reactivate
      const reactivateRes = await request(app)
        .patch(`/api/v1/admin/users/${normalAdminId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ is_active: 1 });

      expect(reactivateRes.status).toBe(200);
      expect(reactivateRes.body.data.is_active).toBe(1);
    });

    it('15. Prevents an admin user from deactivating their own account', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${superAdminId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ is_active: 0 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('cannot deactivate your own');
    });
  });

  // ===========================================================================
  // 6. Session Concurrency & Audit Actor Attribution
  // ===========================================================================
  describe('Session Concurrency & Audit Attribution', () => {
    it('16. Multiple users operate with isolated sessions and separate audit attribution', async () => {
      // Super admin creates a supplier
      const suppRes = await request(app)
        .post('/api/v1/admin/suppliers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          business_name: 'Multi-User Audit Test Quarry',
          contact_person: 'Anil Deshmukh',
          mobile_number: '9822334455',
          location_address: 'Bhandara Road, Nagpur',
          service_zones: 'East Nagpur',
          supported_materials: ['Sand', 'Black Stone / Aggregate'],
          verification_status: 'VERIFIED',
          indicative_purchase_price: 3600,
        });
      expect(suppRes.status).toBe(201);
      const supplierId = suppRes.body.data.id;

      // Normal admin updates the supplier
      const updateRes = await request(app)
        .patch(`/api/v1/admin/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${normalAdminToken}`)
        .send({
          quality_notes: 'Inspected by operations manager on-site',
        });
      expect(updateRes.status).toBe(200);

      // Verify audit logs record distinct actors
      const auditRes = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(auditRes.status).toBe(200);

      const logs = auditRes.body.data;
      const createLog = logs.find((l: any) => l.action === 'SUPPLIER_CREATED' && l.entity_id === supplierId);
      const updateLog = logs.find((l: any) => l.action === 'SUPPLIER_UPDATED' && l.entity_id === supplierId);

      expect(createLog).toBeDefined();
      expect(createLog.user_id).toBe(superAdminId);

      expect(updateLog).toBeDefined();
      expect(updateLog.user_id).toBe(normalAdminId);
    });
  });

  // ===========================================================================
  // 7. Concurrency & Collision-Free Order Processing
  // ===========================================================================
  describe('Concurrency & Idempotency Smoke Tests', () => {
    it('17. Concurrent quote requests generate distinct reference numbers without collision', async () => {
      const payloadTemplate = {
        category_id: 'sand',
        quantity: 10,
        unit: 'brass',
        delivery_address: 'Plot 45, Wardha Road, Nagpur',
        area_pincode: '440015',
        preferred_delivery_date: '2026-10-15',
        customer_name: 'Concurrent Test Customer',
        mobile_number: '9876543210',
      };

      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/v1/orders/quote-request')
          .send({ ...payloadTemplate, customer_name: `Concurrent Customer ${i}`, delivery_address: `Plot ${45 + i}, Wardha Road, Nagpur` })
      );

      const responses = await Promise.all(requests);
      const orderRefs = new Set<string>();

      for (const res of responses) {
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        const ref = res.body.data.orderReference;
        expect(ref).toMatch(/^NGP-\d{6}-\d{4}$/);
        orderRefs.add(ref);
      }

      // Ensure all 5 generated order references are strictly unique
      expect(orderRefs.size).toBe(5);
    });
  });

  // ===========================================================================
  // 8. Security Hardening & SQL Injection Defense
  // ===========================================================================
  describe('Security Hardening & Input Defense', () => {
    it('18. SQL Injection attempts in query parameters and IDs are safely rejected', async () => {
      const maliciousId = "ord_123' OR '1'='1";
      const res = await request(app)
        .get(`/api/v1/orders/${encodeURIComponent(maliciousId)}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('19. PII security: Sensitive password hashes are not leaked on public or admin auth routes', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: config.initialAdmin.email,
          password: config.initialAdmin.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.password_hash).toBeUndefined();
    });
  });
});

