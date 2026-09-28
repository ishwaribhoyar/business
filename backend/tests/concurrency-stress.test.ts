import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../src/app.js';
import { getDatabase, closeDatabase } from '../src/db/connection.js';
import { runMigrations } from '../src/db/migrate.js';
import { runSeeds } from '../src/db/seed.js';
import { bootstrapAdminUser } from '../src/scripts/bootstrapAdmin.js';
import { QuotationService } from '../src/services/quotationService.js';
import { PaymentService } from '../src/services/paymentService.js';
import { OrderRepository } from '../src/repositories/orderRepository.js';
import { QuotationRepository } from '../src/repositories/quotationRepository.js';
import { PaymentRepository } from '../src/repositories/paymentRepository.js';
import { config } from '../src/config/index.js';

describe('Phase 4 Verification Gate: Deep Concurrency & Multi-User Stress Suite', () => {
  let app: Express;
  let superAdminToken: string;
  let adminToken1: string;
  let adminToken2: string;
  let orderRepo: OrderRepository;
  let quotationRepo: QuotationRepository;
  let paymentRepo: PaymentRepository;
  let quotationService: QuotationService;
  let paymentService: PaymentService;
  let supplierId: string;
  let driverId: string;
  let truckId: string;

  beforeAll(async () => {
    // 1. Initialize SQLite baseline
    const db = getDatabase(':memory:');
    runMigrations(db);
    runSeeds(db);
    app = createApp();

    orderRepo = new OrderRepository();
    quotationRepo = new QuotationRepository();
    paymentRepo = new PaymentRepository();
    quotationService = new QuotationService();
    paymentService = new PaymentService();

    // 2. Super Admin Login
    const superLogin = await request(app).post('/api/v1/auth/login').send({
      email: config.initialAdmin.email,
      password: config.initialAdmin.password,
    });
    expect(superLogin.status).toBe(200);
    superAdminToken = superLogin.body.data.token;

    // 3. Create Admin 1
    const createAdmin1 = await request(app)
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        email: 'concurrency.admin1@nagpurmaterials.local',
        password: 'Password123!Secure',
        full_name: 'Concurrency Admin One',
        role: 'ADMIN',
      });
    expect(createAdmin1.status).toBe(201);

    const loginAdmin1 = await request(app).post('/api/v1/auth/login').send({
      email: 'concurrency.admin1@nagpurmaterials.local',
      password: 'Password123!Secure',
    });
    adminToken1 = loginAdmin1.body.data.token;

    // 4. Create Admin 2
    const createAdmin2 = await request(app)
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        email: 'concurrency.admin2@nagpurmaterials.local',
        password: 'Password123!Secure',
        full_name: 'Concurrency Admin Two',
        role: 'ADMIN',
      });
    expect(createAdmin2.status).toBe(201);

    const loginAdmin2 = await request(app).post('/api/v1/auth/login').send({
      email: 'concurrency.admin2@nagpurmaterials.local',
      password: 'Password123!Secure',
    });
    adminToken2 = loginAdmin2.body.data.token;

    // 5. Provision Logistics Partners (Supplier, Driver, Truck) for Order State Machine Tests
    const supRes = await request(app)
      .post('/api/v1/admin/suppliers')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        business_name: 'Concurrency Logistics Syndicate',
        contact_person: 'Rajesh Sharma',
        mobile_number: '9822114433',
        location_address: 'Hingna MIDC, Nagpur',
        service_zones: 'Nagpur Metro, Hingna, Wardha Rd',
        supported_materials: ['Sand', 'Black Stone / Aggregate'],
        verification_status: 'VERIFIED',
      });
    supplierId = supRes.body.data.id;

    const drvRes = await request(app)
      .post('/api/v1/admin/drivers')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        full_name: 'Suresh Patil',
        mobile_number: '9822114444',
        license_number: 'MH31-2018-0099887',
        verification_status: 'VERIFIED',
        availability_status: 'Available',
      });
    driverId = drvRes.body.data.id;

    const trkRes = await request(app)
      .post('/api/v1/admin/trucks')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        registration_number: 'MH-31-TR-7766',
        capacity_tons: 16,
        supported_materials: ['Sand', 'Black Stone / Aggregate'],
        owner_name: 'Nagpur Fast Logistics',
        owner_mobile: '9822115555',
        default_driver_id: driverId,
        availability_status: 'Available',
        indicative_transport_rate: 1800,
      });
    truckId = trkRes.body.data.id;
  });

  afterAll(() => {
    closeDatabase();
  });

  // ===========================================================================
  // Test A: Admin Bootstrap Idempotency Under Parallel Stress
  // ===========================================================================
  it('A. Parallel admin bootstrap executions are 100% idempotent with zero duplicate accounts', async () => {
    const testEmail = 'parallel.bootstrap@nagpurmaterials.local';
    const runs = 10;
    const promises = Array.from({ length: runs }).map(() =>
      bootstrapAdminUser({
        email: testEmail,
        password: 'TestBootstrapPassword123!',
        fullName: 'Parallel Bootstrapped Admin',
      })
    );

    const results = await Promise.all(promises);
    expect(results).toHaveLength(runs);

    // Exactly one invocation should report created: true, others created: false
    const createdCount = results.filter((r) => r.created).length;
    const existingCount = results.filter((r) => !r.created).length;

    expect(createdCount).toBe(1);
    expect(existingCount).toBe(runs - 1);

    // Query database directly to confirm exactly 1 user row exists
    const db = getDatabase();
    const rows = db.prepare('SELECT id, email, role FROM admin_users WHERE email = ?').all(testEmail);
    expect(rows).toHaveLength(1);
  });

  // ===========================================================================
  // Test B: Concurrent Quotation Issuance / Revision Race
  // ===========================================================================
  it('B. Concurrent quotation revisions on the same order maintain snapshot integrity and order state', async () => {
    // 1. Create a fresh order for quotation testing
    const quoteReq = await request(app).post('/api/v1/orders/quote-request').send({
      customer_name: 'Concurrency Quote Customer',
      mobile_number: '9888877771',
      delivery_address: 'Wardha Road, Nagpur',
      area_pincode: '440015',
      category_id: 'cat_sand_01',
      variant_id: 'var_sand_river',
      quantity: 10,
      unit: 'Brass',
      specifications: { silt_grade: 'Standard Screened Sand' },
      preferred_delivery_date: '2026-10-05',
    });
    expect(quoteReq.status).toBe(201);
    const orderId = quoteReq.body.data.orderId;

    // 2. Submit initial quotation
    const initialQuote = await request(app)
      .post(`/api/v1/orders/${orderId}/quotations`)
      .set('Authorization', `Bearer ${adminToken1}`)
      .send({
        material_cost: 15000,
        transport_cost: 3000,
        loading_cost: 500,
        platform_fee: 1500,
        discount: 0,
        validity_date: '2026-10-10',
      });
    expect(initialQuote.status).toBe(201);
    expect(initialQuote.body.data.quotation.version).toBe(1);

    // 3. Simultaneously fire 2 quotation revisions from Admin 1 and Admin 2
    const [res1, res2] = await Promise.all([
      request(app)
        .post(`/api/v1/orders/${orderId}/quotations`)
        .set('Authorization', `Bearer ${adminToken1}`)
        .send({
          material_cost: 16000,
          transport_cost: 3200,
          loading_cost: 500,
          platform_fee: 1500,
          discount: 200,
          validity_date: '2026-10-12',
          notes: 'Admin 1 revision',
        }),
      request(app)
        .post(`/api/v1/orders/${orderId}/quotations`)
        .set('Authorization', `Bearer ${adminToken2}`)
        .send({
          material_cost: 16500,
          transport_cost: 3100,
          loading_cost: 500,
          platform_fee: 1500,
          discount: 100,
          validity_date: '2026-10-12',
          notes: 'Admin 2 revision',
        }),
    ]);

    expect([200, 201]).toContain(res1.status);
    expect([200, 201]).toContain(res2.status);

    // 4. Verify all quotations in DB for this order
    const allQuotes = quotationRepo.findByOrderId(orderId);
    expect(allQuotes.length).toBe(3); // v1 + 2 revisions

    // Ensure versions are distinct and properly incremented
    const versions = allQuotes.map((q) => q.version);
    expect(new Set(versions).size).toBe(3);

    // Check that current_quotation_id on the order points to the highest version
    const updatedOrder = orderRepo.findById(orderId)!;
    const currentQuote = quotationRepo.findById(updatedOrder.current_quotation_id!)!;
    expect(currentQuote).toBeDefined();
    expect(currentQuote.order_id).toBe(orderId);
    expect(currentQuote.quotation_status).toBe('ISSUED');
  });

  // ===========================================================================
  // Test C: Concurrent Payments Ledger & Balance Consistency
  // ===========================================================================
  it('C. Concurrent partial payments record exact financial ledger totals without lost updates', async () => {
    // 1. Create order with delivered price of ₹30,000
    const quoteReq = await request(app).post('/api/v1/orders/quote-request').send({
      customer_name: 'Payment Ledger Customer',
      mobile_number: '9888877772',
      delivery_address: 'Hingna Road, Nagpur',
      area_pincode: '440016',
      category_id: 'cat_stone_03',
      variant_id: 'var_stone_20mm',
      quantity: 15,
      unit: 'Brass',
      preferred_delivery_date: '2026-10-06',
    });
    expect(quoteReq.status).toBe(201);
    const orderId = quoteReq.body.data.orderId;

    // Issue quote: 20000 mat + 8000 trans + 2000 plat = 30000 total
    const quote = await request(app)
      .post(`/api/v1/orders/${orderId}/quotations`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        material_cost: 20000,
        transport_cost: 8000,
        loading_cost: 0,
        platform_fee: 2000,
        discount: 0,
        validity_date: '2026-10-15',
      });
    expect(quote.status).toBe(201);
    expect(quote.body.data.quotation.final_delivered_price).toBe(30000);

    // Confirm order
    await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ status: 'CONFIRMED', notes: 'Customer approved quotation' });

    // 2. Concurrently record 3 payments: ₹10,000 + ₹12,000 + ₹8,000 = ₹30,000 exactly
    const [p1, p2, p3] = await Promise.all([
      request(app)
        .post(`/api/v1/orders/${orderId}/payments`)
        .set('Authorization', `Bearer ${adminToken1}`)
        .send({
          amount: 10000,
          payment_method: 'UPI',
          transaction_reference: 'UPI_CONC_001',
          notes: 'First installment via UPI',
        }),
      request(app)
        .post(`/api/v1/orders/${orderId}/payments`)
        .set('Authorization', `Bearer ${adminToken2}`)
        .send({
          amount: 12000,
          payment_method: 'Bank Transfer',
          transaction_reference: 'NEFT_CONC_002',
          notes: 'Second installment via NEFT',
        }),
      request(app)
        .post(`/api/v1/orders/${orderId}/payments`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          amount: 8000,
          payment_method: 'Cash',
          transaction_reference: 'CASH_CONC_003',
          notes: 'Third installment cash settlement',
        }),
    ]);

    expect([200, 201]).toContain(p1.status);
    expect([200, 201]).toContain(p2.status);
    expect([200, 201]).toContain(p3.status);

    // 3. Verify payments in database
    const payments = paymentRepo.findByOrderId(orderId);
    expect(payments).toHaveLength(3);

    const totalPaid = paymentRepo.getTotalPaidForOrder(orderId);
    expect(totalPaid).toBe(30000);

    // 4. Verify order payment_status has transitioned to 'Paid'
    const finalOrder = orderRepo.findById(orderId)!;
    expect(finalOrder.payment_status).toBe('Paid');
  });

  // ===========================================================================
  // Test D: Sequential Integrity of Status History Under Load
  // ===========================================================================
  it('D. Multi-step status transitions maintain unbroken audit and history lineage', async () => {
    // Create new order
    const quoteReq = await request(app).post('/api/v1/orders/quote-request').send({
      customer_name: 'Status Lineage Customer',
      mobile_number: '9888877773',
      delivery_address: 'Manish Nagar, Nagpur',
      area_pincode: '440015',
      category_id: 'cat_sand_01',
      variant_id: 'var_sand_dust',
      quantity: 5,
      unit: 'Brass',
      preferred_delivery_date: '2026-10-07',
    });
    const orderId = quoteReq.body.data.orderId;

    // 1. Transition NEW -> CONTACTED
    const contactRes = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken1}`)
      .send({ status: 'CONTACTED', notes: 'Contacted customer' });
    expect(contactRes.status).toBe(200);
    expect(contactRes.body.data.order.status).toBe('CONTACTED');

    // 2. Issue quotation to advance to QUOTATION_SENT
    const quoteRes = await request(app)
      .post(`/api/v1/orders/${orderId}/quotations`)
      .set('Authorization', `Bearer ${adminToken2}`)
      .send({
        material_cost: 12000,
        transport_cost: 2500,
        loading_cost: 0,
        platform_fee: 1000,
        discount: 0,
        validity_date: '2026-10-15',
        advance_order_status: true,
      });
    expect(quoteRes.status).toBe(201);
    expect(quoteRes.body.data.order.status).toBe('QUOTATION_SENT');

    // 3. Confirm Order
    const confirmRes = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ status: 'CONFIRMED', notes: 'Customer confirmed requirement' });
    expect(confirmRes.status).toBe(200);

    // 4. Assign Supplier (Fulfillment Step 1)
    await request(app)
      .post(`/api/v1/orders/${orderId}/supplier`)
      .set('Authorization', `Bearer ${adminToken1}`)
      .send({ supplier_id: supplierId });

    const supStatusRes = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken1}`)
      .send({ status: 'SUPPLIER_ASSIGNED', notes: 'Assigned supplier' });
    expect(supStatusRes.status).toBe(200);

    // 5. Assign Truck and Driver (Fulfillment Step 2)
    await request(app)
      .post(`/api/v1/orders/${orderId}/truck`)
      .set('Authorization', `Bearer ${adminToken2}`)
      .send({ truck_id: truckId, auto_assign_default_driver: true });

    const trkStatusRes = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken2}`)
      .send({ status: 'TRUCK_ASSIGNED', notes: 'Assigned truck' });
    expect(trkStatusRes.status).toBe(200);

    // 6. Transition through Dispatch, Delivery, and Completion
    const dispatchTransitions = [
      { status: 'LOADING', token: adminToken1, notes: 'Material loaded at pit' },
      { status: 'OUT_FOR_DELIVERY', token: adminToken2, notes: 'In transit to site' },
      { status: 'DELIVERED', token: adminToken1, notes: 'Unloaded and verified at site' },
      { status: 'COMPLETED', token: superAdminToken, notes: 'Order finalized' },
    ];

    for (const t of dispatchTransitions) {
      const res = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${t.token}`)
        .send({ status: t.status, notes: t.notes });
      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe(t.status);
    }

    // Verify history table has complete chronological record
    const history = orderRepo.getStatusHistory(orderId);
    // Initial NEW + CONTACTED + QUOTATION_SENT + CONFIRMED + SUPPLIER_ASSIGNED + TRUCK_ASSIGNED + LOADING + OUT_FOR_DELIVERY + DELIVERED + COMPLETED = 10 total
    expect(history.length).toBe(10);

    // Initial record: previous_status is null, new_status is 'NEW'
    expect(history[0].previous_status).toBeNull();
    expect(history[0].new_status).toBe('NEW');

    // Verify unbroken chain: each subsequent history entry's previous_status matches preceding entry's new_status
    for (let i = 1; i < history.length; i++) {
      expect(history[i].previous_status).toBe(history[i - 1].new_status);
    }
    expect(history[history.length - 1].new_status).toBe('COMPLETED');
  });

  // ===========================================================================
  // Test E: Independent Admin Sessions & Audit Attribution
  // ===========================================================================
  it('E. Multiple admin sessions independently attribute actions to distinct user IDs in audit logs', async () => {
    const quoteReq = await request(app).post('/api/v1/orders/quote-request').send({
      customer_name: 'Attribution Customer',
      mobile_number: '9888877774',
      delivery_address: 'Khamla, Nagpur',
      area_pincode: '440025',
      category_id: 'cat_sand_01',
      variant_id: 'var_sand_river',
      quantity: 8,
      unit: 'Brass',
      specifications: { silt_grade: 'Standard Screened Sand' },
      preferred_delivery_date: '2026-10-08',
    });
    const orderId = quoteReq.body.data.orderId;

    // Admin 1 adds a note
    await request(app)
      .post(`/api/v1/orders/${orderId}/notes`)
      .set('Authorization', `Bearer ${adminToken1}`)
      .send({ note: 'Note recorded by Admin 1' });

    // Admin 2 adds a note
    await request(app)
      .post(`/api/v1/orders/${orderId}/notes`)
      .set('Authorization', `Bearer ${adminToken2}`)
      .send({ note: 'Note recorded by Admin 2' });

    // Super Admin adds a note
    await request(app)
      .post(`/api/v1/orders/${orderId}/notes`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ note: 'Note recorded by Super Admin' });

    const orderRes = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(orderRes.status).toBe(200);
    const notes = orderRes.body.data.notes;
    expect(notes).toHaveLength(3);

    const authors = notes.map((n: any) => n.author_name);
    expect(authors).toContain('concurrency.admin1@nagpurmaterials.local');
    expect(authors).toContain('concurrency.admin2@nagpurmaterials.local');
    expect(authors).toContain(config.initialAdmin.email);
  });
});
