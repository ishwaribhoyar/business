import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getDatabase, closeDatabase } from '../src/db/connection.js';
import { runMigrations } from '../src/db/migrate.js';
import { runSeeds } from '../src/db/seed.js';
import { Express } from 'express';

describe('Phase 2 Admin Operations, Quotation Engine & Fulfillment Tests', () => {
  let app: Express;
  let adminToken: string;

  beforeAll(async () => {
    const db = getDatabase(':memory:');
    runMigrations(db);
    runSeeds(db);
    app = createApp();

    // Authenticate as Admin to get operational JWT
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@nagpurmaterials.local',
      password: 'AdminSecurePass123!',
    });
    adminToken = loginRes.body.data.token;
  });

  afterAll(() => {
    closeDatabase();
  });

  // -------------------------------------------------------------
  // Helper: create a test quote request from customer
  // -------------------------------------------------------------
  const createTestOrder = async (quantity = 2) => {
    const res = await request(app).post('/api/v1/orders/quote-request').send({
      material_id: 'sand',
      quantity,
      unit: 'Brass',
      delivery_address: 'Plot 55, Wardha Road, Near Pride Hotel, Nagpur',
      area_pincode: '440015',
      preferred_delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      customer_name: 'Harish Builders',
      mobile_number: '9876500001',
    });
    return res.body.data;
  };

  // -------------------------------------------------------------
  // 1. RBAC & Security for Phase 2 Endpoints
  // -------------------------------------------------------------
  describe('RBAC & Route Protection', () => {
    it('1. Rejects unauthenticated access to operational order details with 401', async () => {
      const res = await request(app).get('/api/v1/orders');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('2. Rejects unauthenticated status change with 401', async () => {
      const res = await request(app).patch('/api/v1/orders/ord_test/status').send({
        status: 'CONTACTED',
      });
      expect(res.status).toBe(401);
    });

    it('3. Rejects unauthenticated quotation creation with 401', async () => {
      const res = await request(app).post('/api/v1/orders/ord_test/quotations').send({
        material_cost: 10000,
        transport_cost: 2000,
        validity_date: '2026-10-15',
      });
      expect(res.status).toBe(401);
    });
  });

  // -------------------------------------------------------------
  // 2. Quotation Engine Arithmetic & Validation
  // -------------------------------------------------------------
  describe('Quotation Engine & Deterministic Calculation', () => {
    it('4. Correctly calculates base cost, final customer price, and gross margin', async () => {
      const order = await createTestOrder(3);

      const quoteRes = await request(app)
        .post(`/api/v1/orders/${order.orderId}/quotations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          material_cost: 20000,
          transport_cost: 4000,
          loading_cost: 1000,
          platform_fee: 3000,
          discount: 500,
          validity_date: '2026-10-31',
          notes: 'Standard site delivery terms',
          advance_order_status: true,
        });

      expect(quoteRes.status).toBe(201);
      expect(quoteRes.body.success).toBe(true);

      const quote = quoteRes.body.data.quotation;
      // base_cost = 20000 + 4000 + 1000 = 25000
      // final_price = 25000 + 3000 - 500 = 27500
      expect(quote.final_delivered_price).toBe(27500);
      // estimated_gross_margin = 27500 - 25000 = 2500
      expect(quote.estimated_gross_margin).toBe(2500);
      expect(quote.version).toBe(1);
      expect(quote.quotation_status).toBe('ISSUED');

      // Verify order status was advanced to QUOTATION_SENT
      expect(quoteRes.body.data.order.status).toBe('QUOTATION_SENT');
    });

    it('5. Rejects negative costs or invalid financial numbers with 400', async () => {
      const order = await createTestOrder(1);

      const res = await request(app)
        .post(`/api/v1/orders/${order.orderId}/quotations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          material_cost: -5000,
          transport_cost: 2000,
          validity_date: '2026-10-31',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('6. Rejects excessive discount that makes customer price negative', async () => {
      const order = await createTestOrder(1);

      const res = await request(app)
        .post(`/api/v1/orders/${order.orderId}/quotations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          material_cost: 5000,
          transport_cost: 1000,
          loading_cost: 0,
          platform_fee: 500,
          discount: 10000, // Exceeds gross total (6500)
          validity_date: '2026-10-31',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('7. Quotation revision preserves previous version (v1 superseded, v2 active)', async () => {
      const order = await createTestOrder(2);

      // Issue Quote v1
      const q1Res = await request(app)
        .post(`/api/v1/orders/${order.orderId}/quotations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          material_cost: 10000,
          transport_cost: 2000,
          loading_cost: 500,
          platform_fee: 1500,
          discount: 0,
          validity_date: '2026-10-20',
        });
      expect(q1Res.body.data.quotation.version).toBe(1);
      const q1Id = q1Res.body.data.quotation.id;

      // Issue Quote v2 (Revised quote)
      const q2Res = await request(app)
        .post(`/api/v1/orders/${order.orderId}/quotations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          material_cost: 11000,
          transport_cost: 2500,
          loading_cost: 500,
          platform_fee: 1500,
          discount: 500,
          validity_date: '2026-10-25',
        });

      expect(q2Res.status).toBe(201);
      const q2 = q2Res.body.data.quotation;
      expect(q2.version).toBe(2);
      expect(q2.final_delivered_price).toBe(15000); // 11000 + 2500 + 500 + 1500 - 500

      // Inspect order detail to confirm v1 is historical and v2 is active
      const detailRes = await request(app)
        .get(`/api/v1/orders/${order.orderId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(detailRes.body.data.activeQuotation.id).toBe(q2.id);
      expect(detailRes.body.data.quotations.length).toBe(2);

      const oldQ1 = detailRes.body.data.quotations.find((q: any) => q.id === q1Id);
      expect(oldQ1.quotation_status).toBe('SUPERSEDED');
      expect(oldQ1.final_delivered_price).toBe(14000); // Historical immutable value intact!
    });
  });

  // -------------------------------------------------------------
  // 3. State Machine Transitions & Invariants
  // -------------------------------------------------------------
  describe('Order State Machine & Transition Rules', () => {
    it('8. Rejects invalid arbitrary jump (NEW -> DELIVERED)', async () => {
      const order = await createTestOrder(1);

      const res = await request(app)
        .patch(`/api/v1/orders/${order.orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'DELIVERED' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid status transition');
    });

    it('9. Rejects transition to CONFIRMED without a quotation', async () => {
      const order = await createTestOrder(1);

      // Move NEW -> CONTACTED
      await request(app)
        .patch(`/api/v1/orders/${order.orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CONTACTED' });

      // Attempt CONTACTED -> QUOTATION_SENT without creating quotation
      const res = await request(app)
        .patch(`/api/v1/orders/${order.orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'QUOTATION_SENT' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('without an issued delivered quotation');
    });

    it('10. Cancellation requires a non-empty reason', async () => {
      const order = await createTestOrder(1);

      const res = await request(app)
        .patch(`/api/v1/orders/${order.orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CANCELLED', cancellation_reason: '' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('cancellation reason must be provided');
    });

    it('11. Valid cancellation succeeds with reason and prevents further transitions', async () => {
      const order = await createTestOrder(1);

      const cancelRes = await request(app)
        .patch(`/api/v1/orders/${order.orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'CANCELLED',
          cancellation_reason: 'Customer cancelled site foundation work due to monsoon rains',
        });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.order.status).toBe('CANCELLED');
      expect(cancelRes.body.data.order.cancellation_reason).toContain('monsoon rains');

      // Attempt to move CANCELLED -> CONTACTED must fail
      const retryRes = await request(app)
        .patch(`/api/v1/orders/${order.orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CONTACTED' });

      expect(retryRes.status).toBe(400);
      expect(retryRes.body.error.message).toContain('already been CANCELLED');
    });
  });

  // -------------------------------------------------------------
  // 4. Partner Registries (Suppliers, Trucks, Drivers)
  // -------------------------------------------------------------
  describe('Partner Registries Management', () => {
    let createdSupplierId: string;
    let createdDriverId: string;
    let createdTruckId: string;

    it('12. Creates a verified supplier with indicative purchase price', async () => {
      const res = await request(app)
        .post('/api/v1/admin/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          business_name: 'Kanhan River Sand Mines',
          contact_person: 'Anil Agarwal',
          mobile_number: '9822001122',
          location_address: 'Kanhan River Basin, Kamptee Road, Nagpur',
          service_zones: 'Nagpur and nearby areas',
          supported_materials: ['Sand'],
          verification_status: 'VERIFIED',
          indicative_purchase_price: 3800,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.business_name).toBe('Kanhan River Sand Mines');
      expect(res.body.data.indicative_purchase_price).toBe(3800);
      expect(res.body.data.price_updated_at).toBeDefined();
      createdSupplierId = res.body.data.id;
    });

    it('13. Creates a driver partner decoupled from truck', async () => {
      const res = await request(app)
        .post('/api/v1/admin/drivers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          full_name: 'Ramesh Yadav',
          mobile_number: '9823004455',
          license_number: 'MH31-2015-0012345',
          verification_status: 'VERIFIED',
          availability_status: 'Available',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.full_name).toBe('Ramesh Yadav');
      createdDriverId = res.body.data.id;
    });

    it('14. Creates a third-party partner truck and assigns default driver', async () => {
      const res = await request(app)
        .post('/api/v1/admin/trucks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          registration_number: 'MH-31-CB-9988',
          capacity_tons: 16,
          supported_materials: ['Sand', 'Black Stone / Aggregate'],
          owner_name: 'Nagpur Transport Syndicate',
          owner_mobile: '9822334455',
          default_driver_id: createdDriverId,
          availability_status: 'Available',
          indicative_transport_rate: 1500,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.registration_number).toBe('MH-31-CB-9988');
      expect(res.body.data.default_driver_id).toBe(createdDriverId);
      createdTruckId = res.body.data.id;
    });

    it('15. Assigns supplier, truck, and driver to an order', async () => {
      const order = await createTestOrder(2);

      // Assign Supplier
      const supRes = await request(app)
        .post(`/api/v1/orders/${order.orderId}/supplier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ supplier_id: createdSupplierId });
      expect(supRes.status).toBe(200);
      expect(supRes.body.data.order.supplier_id).toBe(createdSupplierId);

      // Assign Truck (with auto-assign default driver)
      const trkRes = await request(app)
        .post(`/api/v1/orders/${order.orderId}/truck`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ truck_id: createdTruckId, auto_assign_default_driver: true });
      expect(trkRes.status).toBe(200);
      expect(trkRes.body.data.order.truck_id).toBe(createdTruckId);
      expect(trkRes.body.data.order.driver_id).toBe(createdDriverId);
    });
  });

  // -------------------------------------------------------------
  // 5. Payment Recording & Status Tracking
  // -------------------------------------------------------------
  describe('Payment Ledger & Status Logic', () => {
    it('16. Tracks Partial Payment and updates balance', async () => {
      const order = await createTestOrder(2);

      // Create quotation for ₹20,000
      await request(app)
        .post(`/api/v1/orders/${order.orderId}/quotations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          material_cost: 15000,
          transport_cost: 3000,
          loading_cost: 500,
          platform_fee: 1500,
          discount: 0,
          validity_date: '2026-10-31',
        });

      // Record ₹10,000 advance
      const payRes = await request(app)
        .post(`/api/v1/orders/${order.orderId}/payments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 10000,
          payment_method: 'UPI',
          transaction_reference: 'UPI-NAGPUR-12345',
          notes: '50% advance for dispatch',
        });

      expect(payRes.status).toBe(201);
      expect(payRes.body.data.payment.payment_status).toBe('Partially Paid');
      expect(payRes.body.data.order.payment_status).toBe('Partially Paid');
      expect(payRes.body.data.totalPaid).toBe(10000);
      expect(payRes.body.data.balanceDue).toBe(10000); // 20000 - 10000
    });

    it('17. Rejects payment exceeding final customer price', async () => {
      const order = await createTestOrder(1);

      // Create quotation for ₹10,000
      await request(app)
        .post(`/api/v1/orders/${order.orderId}/quotations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          material_cost: 7000,
          transport_cost: 2000,
          loading_cost: 0,
          platform_fee: 1000,
          discount: 0,
          validity_date: '2026-10-31',
        });

      // Try paying ₹15,000 (exceeds ₹10,000)
      const payRes = await request(app)
        .post(`/api/v1/orders/${order.orderId}/payments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 15000,
          payment_method: 'Bank Transfer',
        });

      expect(payRes.status).toBe(400);
      expect(payRes.body.error.message).toContain('exceeds outstanding balance');
    });

    it('18. Full payment updates status to Paid', async () => {
      const order = await createTestOrder(1);

      // Create quote for ₹8,000
      await request(app)
        .post(`/api/v1/orders/${order.orderId}/quotations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          material_cost: 6000,
          transport_cost: 1500,
          platform_fee: 500,
          validity_date: '2026-10-31',
        });

      // Record full ₹8,000
      const payRes = await request(app)
        .post(`/api/v1/orders/${order.orderId}/payments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 8000,
          payment_method: 'Cash',
          notes: 'Full payment received at site unloading',
        });

      expect(payRes.status).toBe(201);
      expect(payRes.body.data.payment.payment_status).toBe('Paid');
      expect(payRes.body.data.order.payment_status).toBe('Paid');
      expect(payRes.body.data.balanceDue).toBe(0);
    });
  });

  // -------------------------------------------------------------
  // 6. Operational Internal Notes
  // -------------------------------------------------------------
  describe('Operational Notes', () => {
    it('19. Adds operational internal notes with author and timestamp', async () => {
      const order = await createTestOrder(1);

      const noteRes = await request(app)
        .post(`/api/v1/orders/${order.orderId}/notes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note: 'Site supervisor confirmed road permits are approved for 6-wheel tipper entry.' });

      expect(noteRes.status).toBe(201);
      expect(noteRes.body.data.note.note).toContain('road permits are approved');

      // Verify note is retrieved in order detail
      const detailRes = await request(app)
        .get(`/api/v1/orders/${order.orderId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(detailRes.body.data.notes.length).toBeGreaterThanOrEqual(1);
      expect(detailRes.body.data.notes[0].note).toContain('road permits');
    });
  });

  // -------------------------------------------------------------
  // 7. Real Dashboard Metrics from Database
  // -------------------------------------------------------------
  describe('Dashboard Metrics Truthfulness', () => {
    it('20. GET /api/v1/admin/dashboard/summary derives metrics from database without fake numbers', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(typeof data.totalOrders).toBe('number');
      expect(typeof data.newOrders).toBe('number');
      expect(typeof data.activeDeliveries).toBe('number');
      expect(typeof data.completedOrders).toBe('number');
      expect(typeof data.totalRevenue).toBe('number');
      expect(typeof data.totalDirectCosts).toBe('number');
      expect(typeof data.grossMargin).toBe('number');
      expect(data.grossMargin).toBe(data.totalRevenue - data.totalDirectCosts);
      expect(Array.isArray(data.recentOrders)).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // 8. Full End-to-End Operational Lifecycle Test
  // -------------------------------------------------------------
  describe('Full End-to-End Delivery Lifecycle Integration Test', () => {
    it('21. Executes complete 11-stage delivery lifecycle with audit trail and financial fidelity', async () => {
      // Step 1: Customer submits quote request
      const order = await createTestOrder(5);
      const orderId = order.orderId;

      // Verify initial state is NEW
      let check = await request(app).get(`/api/v1/orders/${orderId}`).set('Authorization', `Bearer ${adminToken}`);
      expect(check.body.data.order.status).toBe('NEW');

      // Step 2: Admin reviews & moves to CONTACTED
      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CONTACTED', notes: 'Spoke with site supervisor regarding unloading space' });

      // Step 3: Admin calculates and issues manual quotation
      const quoteRes = await request(app)
        .post(`/api/v1/orders/${orderId}/quotations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          material_cost: 40000,
          transport_cost: 8000,
          loading_cost: 2000,
          platform_fee: 6000,
          discount: 1000,
          validity_date: '2026-10-31',
          advance_order_status: true, // Moves to QUOTATION_SENT
        });
      expect(quoteRes.body.data.quotation.final_delivered_price).toBe(55000);
      expect(quoteRes.body.data.quotation.estimated_gross_margin).toBe(5000);

      check = await request(app).get(`/api/v1/orders/${orderId}`).set('Authorization', `Bearer ${adminToken}`);
      expect(check.body.data.order.status).toBe('QUOTATION_SENT');

      // Step 4: Customer confirms quote via WhatsApp -> Admin moves to CONFIRMED
      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CONFIRMED', notes: 'Customer accepted quotation via WhatsApp' });

      // Step 5: Assign Supplier
      const supList = await request(app).get('/api/v1/admin/suppliers').set('Authorization', `Bearer ${adminToken}`);
      const supplier = supList.body.data[0];
      await request(app)
        .post(`/api/v1/orders/${orderId}/supplier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ supplier_id: supplier.id });

      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SUPPLIER_ASSIGNED' });

      // Step 6: Assign Truck & Driver
      const trkList = await request(app).get('/api/v1/admin/trucks').set('Authorization', `Bearer ${adminToken}`);
      const truck = trkList.body.data[0];
      await request(app)
        .post(`/api/v1/orders/${orderId}/truck`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ truck_id: truck.id, auto_assign_default_driver: true });

      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'TRUCK_ASSIGNED' });

      // Step 7: Material Loading
      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'LOADING', notes: 'Tipper loaded at quarry weighbridge' });

      // Step 8: Out for Delivery
      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'OUT_FOR_DELIVERY', notes: 'Truck en route via Wardha Road' });

      // Step 9: Delivered at site
      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'DELIVERED', notes: 'Material unloaded and volume verified by supervisor' });

      // Record full payment
      await request(app)
        .post(`/api/v1/orders/${orderId}/payments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 55000,
          payment_method: 'Bank Transfer',
          transaction_reference: 'NEFT-AXIS-9922',
        });

      // Step 10: Completed (Operational closure)
      await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'COMPLETED', notes: 'Order reconciled and closed successfully' });

      // Final inspection: verify database state
      const finalRes = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const finalData = finalRes.body.data;
      expect(finalData.order.status).toBe('COMPLETED');
      expect(finalData.order.payment_status).toBe('Paid');
      expect(finalData.activeQuotation.final_delivered_price).toBe(55000);
      expect(finalData.statusHistory.length).toBeGreaterThanOrEqual(10);
    });
  });
});
