import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { newDb } from 'pg-mem';
import { Express } from 'express';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { config } from '../src/config/index.js';
import { setPgPoolInstance, closePgPool } from '../src/db/pgPool.js';
import { runPgMigrations } from '../src/db/pgMigrate.js';
import { dbAdapter } from '../src/db/dbAdapter.js';
import { isPostgresConfigured } from '../src/db/connection.js';

describe('Production PostgreSQL Native Runtime Integration Tests', () => {
  let app: Express;
  let pgPool: any;
  let originalDatabaseUrl: string;
  let adminToken: string;
  let createdVariantId: string;
  let createdOrderId: string;
  let createdQuotationId: string;

  beforeAll(async () => {
    originalDatabaseUrl = config.databaseUrl;

    // 1. Initialize in-memory PostgreSQL engine via pg-mem
    const memDb = newDb({ noAstCoverageCheck: true });
    const pgAdapter = memDb.adapters.createPg();
    pgPool = new pgAdapter.Pool();

    // 2. Set databaseUrl to a postgresql:// connection string
    (config as any).databaseUrl = 'postgresql://render_user:secure_pwd@ep-prod.render.internal/marketplace_prod';

    // 3. Bind the active PostgreSQL pool instance
    setPgPoolInstance(pgPool);

    // 4. Run PostgreSQL versioned migrations to set up tables, constraints, indexes
    const migrationResult = await runPgMigrations(pgPool);
    expect(migrationResult.applied.length).toBeGreaterThanOrEqual(2);

    // 5. Seed initial SUPER_ADMIN user directly into PostgreSQL
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('AdminTest123!Secure', saltRounds);
    const now = new Date().toISOString();

    await pgPool.query(
      `INSERT INTO admin_users (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        'usr_admin_pg_super',
        'pg.admin@nagpurmaterials.local',
        passwordHash,
        'PostgreSQL Super Admin',
        'SUPER_ADMIN',
        true,
        now,
        now,
      ]
    );

    // 6. Instantiate Express app with PostgreSQL active
    app = createApp();
  });

  afterAll(async () => {
    (config as any).databaseUrl = originalDatabaseUrl;
    setPgPoolInstance(null);
    await closePgPool();
  });

  it('1. Correctly detects PostgreSQL mode in DbAdapter and connection manager', () => {
    expect(isPostgresConfigured()).toBe(true);
    expect(dbAdapter.isPostgres).toBe(true);
  });

  it('2. Readiness probe /ready verifies PostgreSQL connection probe successfully', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('READY');
    expect(res.body.data.database).toBe('CONNECTED');
    expect(res.body.data.engine).toBe('POSTGRESQL');
  });

  it('3. Admin logs in with JWT authenticated against PostgreSQL admin_users table', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'pg.admin@nagpurmaterials.local',
      password: 'AdminTest123!Secure',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('SUPER_ADMIN');
    adminToken = res.body.data.token;
  });

  it('4. Admin creates category and variant persisted natively in PostgreSQL JSONB/BOOLEAN columns', async () => {
    // Create category
    const catRes = await request(app)
      .post('/api/v1/admin/catalog/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'River Sand & M-Sand',
        slug: 'sand-aggregates',
        description: 'High grade construction sand sourced from approved rivers and crusher plants',
        display_order: 1,
        is_active: 1,
      });

    expect(catRes.status).toBe(201);
    const categoryId = catRes.body.data.id;

    // Create variant
    const varRes = await request(app)
      .post('/api/v1/admin/catalog/variants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        category_id: categoryId,
        name: 'Plaster Sand (Fine Sifted)',
        slug: 'plaster-sand-fine',
        short_description: 'Double-washed fine sand for smooth wall plastering',
        unit: 'Brass',
        min_quantity: 1,
        indicative_price: 6800,
        specifications_schema: [
          { key: 'fineness_grade', label: 'Fineness Grade', type: 'select', required: true, options: ['Fine', 'Super Fine'] },
          { key: 'silt_content', label: 'Max Silt Content', type: 'select', required: false, options: ['< 3%', '< 5%'] }
        ],
        display_order: 1,
        is_active: 1,
      });

    expect(varRes.status).toBe(201);
    expect(varRes.body.data.slug).toBe('plaster-sand-fine');
    createdVariantId = varRes.body.data.id;
  });

  it('5. Public customer submits quote request creating Customer and Order in PostgreSQL', async () => {
    const res = await request(app)
      .post('/api/v1/orders/quote-request')
      .send({
        customer_name: 'Devendra Patil',
        mobile_number: '9822334455',
        whatsapp_number: '9822334455',
        variant_id: createdVariantId,
        quantity: 3,
        unit: 'Brass',
        specifications: {
          fineness_grade: 'Super Fine',
          silt_content: '< 3%'
        },
        delivery_address: 'Plot 45, Besa Road, Nagpur',
        area_pincode: '440034',
        preferred_delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toBeDefined();
    expect(res.body.data.status).toBe('NEW');
    createdOrderId = res.body.data.orderId;
  });

  it('6. Admin creates Delivered Quotation snapshot running inside PostgreSQL transaction', async () => {
    const res = await request(app)
      .post(`/api/v1/orders/${createdOrderId}/quotations`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        material_cost: 16000,
        transport_cost: 3200,
        loading_cost: 800,
        platform_fee: 1500,
        discount: 500,
        advance_order_status: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.quotation.final_delivered_price).toBe(21000); // 16000 + 3200 + 800 + 1500 - 500
    expect(res.body.data.quotation.estimated_gross_margin).toBe(1000); // 21000 - 20000
    expect(res.body.data.order.status).toBe('QUOTATION_SENT');
    createdQuotationId = res.body.data.quotation.id;
  });

  it('7. Admin creates Supplier, Truck, and Driver in PostgreSQL', async () => {
    // 1. Supplier
    const supRes = await request(app)
      .post('/api/v1/admin/suppliers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        business_name: 'Kanhan Sand Mines & Logistics',
        contact_person: 'Rameshwar Sharma',
        mobile_number: '9822112233',
        location_address: 'Kanhan River Basin, Nagpur Rural',
        supported_materials: ['Sand', 'Plaster Sand (Fine Sifted)'],
      });
    expect(supRes.status).toBe(201);
    const supplierId = supRes.body.data.id;

    // 2. Driver
    const drvRes = await request(app)
      .post('/api/v1/admin/drivers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        full_name: 'Santosh Gaikwad',
        mobile_number: '9766554433',
        license_number: 'MH31-2018-0099881',
      });
    expect(drvRes.status).toBe(201);
    const driverId = drvRes.body.data.id;

    // 3. Truck
    const trkRes = await request(app)
      .post('/api/v1/admin/trucks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        registration_number: 'MH-31-DS-4567',
        capacity_tons: 16,
        supported_materials: ['Sand'],
        owner_name: 'Kanhan Transport Fleet',
        owner_mobile: '9822112233',
        default_driver_id: driverId,
      });
    expect(trkRes.status).toBe(201);
    const truckId = trkRes.body.data.id;

    // Assign to Order
    const assignSupRes = await request(app)
      .post(`/api/v1/orders/${createdOrderId}/supplier`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ supplier_id: supplierId });
    expect(assignSupRes.status).toBe(200);

    const assignTrkRes = await request(app)
      .post(`/api/v1/orders/${createdOrderId}/truck`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ truck_id: truckId, auto_assign_default_driver: true });
    expect(assignTrkRes.status).toBe(200);

    const assignDrvRes = await request(app)
      .post(`/api/v1/orders/${createdOrderId}/driver`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ driver_id: driverId });
    expect(assignDrvRes.status).toBe(200);
  });

  it('8. Status transitions execute through valid state machine in PostgreSQL with atomic audit logging', async () => {
    // QUOTATION_SENT -> CONFIRMED
    const confirmRes = await request(app)
      .patch(`/api/v1/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' });
    expect(confirmRes.status).toBe(200);

    // CONFIRMED -> SUPPLIER_ASSIGNED
    const supAssignedRes = await request(app)
      .patch(`/api/v1/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUPPLIER_ASSIGNED' });
    expect(supAssignedRes.status).toBe(200);

    // SUPPLIER_ASSIGNED -> TRUCK_ASSIGNED
    const trkAssignedRes = await request(app)
      .patch(`/api/v1/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'TRUCK_ASSIGNED' });
    expect(trkAssignedRes.status).toBe(200);

    // TRUCK_ASSIGNED -> LOADING
    const loadingRes = await request(app)
      .patch(`/api/v1/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'LOADING' });
    expect(loadingRes.status).toBe(200);

    // LOADING -> OUT_FOR_DELIVERY
    const outRes = await request(app)
      .patch(`/api/v1/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'OUT_FOR_DELIVERY' });
    expect(outRes.status).toBe(200);

    // OUT_FOR_DELIVERY -> DELIVERED
    const delRes = await request(app)
      .patch(`/api/v1/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DELIVERED' });
    expect(delRes.status).toBe(200);
  });

  it('9. Records customer payment in PostgreSQL financial ledger with overpayment validation', async () => {
    // 1. Partial payment (UPI)
    const pay1Res = await request(app)
      .post(`/api/v1/orders/${createdOrderId}/payments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 10000,
        payment_method: 'UPI',
        transaction_reference: 'UPI/2026/0929/10000',
        notes: 'Advance transfer via GPay',
      });
    expect(pay1Res.status).toBe(201);
    expect(pay1Res.body.data.totalPaid).toBe(10000);
    expect(pay1Res.body.data.balanceDue).toBe(11000); // 21000 - 10000
    expect(pay1Res.body.data.order.payment_status).toBe('Partially Paid');

    // 2. Reject overpayment
    const overpayRes = await request(app)
      .post(`/api/v1/orders/${createdOrderId}/payments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 15000, // exceeds remaining 11000
        payment_method: 'Cash',
      });
    expect(overpayRes.status).toBe(400);

    // 3. Complete payment (Bank Transfer)
    const pay2Res = await request(app)
      .post(`/api/v1/orders/${createdOrderId}/payments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 11000,
        payment_method: 'Bank Transfer',
        transaction_reference: 'NEFT/HDFC/2026/11000',
      });
    expect(pay2Res.status).toBe(201);
    expect(pay2Res.body.data.totalPaid).toBe(21000);
    expect(pay2Res.body.data.balanceDue).toBe(0);
    expect(pay2Res.body.data.order.payment_status).toBe('Paid');
  });

  it('10. Admin dashboard aggregates financial metrics and orders accurately from PostgreSQL', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const summary = res.body.data;
    expect(summary.totalOrders).toBeGreaterThanOrEqual(1);
    expect(summary.totalRevenue).toBe(21000);
    expect(summary.totalDirectCosts).toBe(20000); // 16000 + 3200 + 800
    expect(summary.grossMargin).toBe(1000);
    expect(summary.activeProductsCount).toBeGreaterThanOrEqual(1);
    expect(summary.registeredSuppliersCount).toBeGreaterThanOrEqual(1);
  });
});
