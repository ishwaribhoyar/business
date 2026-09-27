import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getDatabase, closeDatabase } from '../src/db/connection.js';
import { runMigrations } from '../src/db/migrate.js';
import { runSeeds } from '../src/db/seed.js';
import { Express } from 'express';

describe('Phase 1 Customer Marketplace & Quote Request Tests', () => {
  let app: Express;

  beforeAll(() => {
    const db = getDatabase(':memory:');
    runMigrations(db);
    runSeeds(db);
    app = createApp();
  });

  afterAll(() => {
    closeDatabase();
  });

  // 1. Product Catalog Listing
  it('1. GET /api/v1/products returns all 4 active MVP materials', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(4);

    const slugs = res.body.data.map((p: any) => p.slug);
    expect(slugs).toContain('sand');
    expect(slugs).toContain('bricks');
    expect(slugs).toContain('black-stone-aggregate');
    expect(slugs).toContain('murum');
  });

  // 2. Product Detail by Slug
  it('2. GET /api/v1/products/:slug returns correct product details', async () => {
    const res = await request(app).get('/api/v1/products/sand');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Sand');
    expect(res.body.data.unit).toBe('Brass');
    expect(res.body.data.min_quantity).toBeGreaterThanOrEqual(1);
    expect(res.body.data.typical_use_cases).toBeDefined();
  });

  // 3. Product Slug Alias Resolution
  it('3. GET /api/v1/products/:slug resolves aliases (black-stone and aggregate)', async () => {
    const res1 = await request(app).get('/api/v1/products/black-stone');
    expect(res1.status).toBe(200);
    expect(res1.body.data.slug).toBe('black-stone-aggregate');

    const res2 = await request(app).get('/api/v1/products/aggregate');
    expect(res2.status).toBe(200);
    expect(res2.body.data.slug).toBe('black-stone-aggregate');
  });

  // 4. Invalid Product returns 404
  it('4. GET /api/v1/products/:slug with invalid slug returns clean 404', async () => {
    const res = await request(app).get('/api/v1/products/non-existent-material');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  // 5. Quote request succeeds with valid data
  it('5. POST /api/v1/orders/quote-request succeeds with valid data', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const payload = {
      material_id: 'prod_sand_01',
      quantity: 2,
      unit: 'Brass',
      delivery_address: 'Site 404, Near Hingna T-Point, Nagpur',
      area_pincode: 'Hingna (440016)',
      preferred_delivery_date: tomorrow,
      customer_name: 'Rajesh Sharma',
      mobile_number: '9822334455',
      whatsapp_number: '9822334455',
      additional_notes: 'Need morning unloading if possible',
    };

    const res = await request(app).post('/api/v1/orders/quote-request').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toMatch(/^ord_/);
    expect(res.body.data.orderReference).toMatch(/^NGP-\d{6}-\d{4}$/);
    expect(res.body.data.status).toBe('NEW');
    expect(res.body.data.whatsappDirectUrl).toBeDefined();
  });

  // 6. Quote request fails with zero or negative quantity
  it('6. POST /api/v1/orders/quote-request fails with zero or negative quantity', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const payload = {
      material_id: 'prod_sand_01',
      quantity: 0,
      unit: 'Brass',
      delivery_address: 'Plot 10, Civil Lines, Nagpur',
      area_pincode: 'Civil Lines (440001)',
      preferred_delivery_date: tomorrow,
      customer_name: 'Test Customer',
      mobile_number: '9822334455',
    };

    const res = await request(app).post('/api/v1/orders/quote-request').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // 7. Quote request fails with invalid mobile
  it('7. POST /api/v1/orders/quote-request fails with invalid mobile format', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const payload = {
      material_id: 'prod_sand_01',
      quantity: 2,
      unit: 'Brass',
      delivery_address: 'Plot 10, Civil Lines, Nagpur',
      area_pincode: '440001',
      preferred_delivery_date: tomorrow,
      customer_name: 'Test Customer',
      mobile_number: '12345', // Invalid format
    };

    const res = await request(app).post('/api/v1/orders/quote-request').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // 8. Quote request fails with incompatible unit
  it('8. POST /api/v1/orders/quote-request fails when unit does not match product', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const payload = {
      material_id: 'prod_sand_01', // Sand expects "Brass"
      quantity: 2,
      unit: 'Pieces', // Invalid unit for Sand
      delivery_address: 'Plot 10, Civil Lines, Nagpur',
      area_pincode: '440001',
      preferred_delivery_date: tomorrow,
      customer_name: 'Test Customer',
      mobile_number: '9822334455',
    };

    const res = await request(app).post('/api/v1/orders/quote-request').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('not compatible with material');
  });

  // 9. Quote request preserves reference ID format
  it('9. Order reference follows NGP-YYMMDD-XXXX format', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const payload = {
      material_id: 'prod_bricks_02',
      quantity: 2000,
      unit: 'Pieces',
      delivery_address: 'Plot 88, Besa Road, Nagpur',
      area_pincode: 'Besa (440037)',
      preferred_delivery_date: tomorrow,
      customer_name: 'Vikram Builder',
      mobile_number: '9876501234',
    };

    const res = await request(app).post('/api/v1/orders/quote-request').send(payload);
    expect(res.status).toBe(201);
    const ref = res.body.data.orderReference;
    expect(ref).toMatch(/^NGP-\d{6}-\d{4}$/);
  });

  // 10. Customer created without requiring password/account
  it('10. Customer record is created without password or login credentials', async () => {
    const db = getDatabase();
    const customer = db.prepare("SELECT * FROM customers WHERE mobile_number = '9876501234'").get() as any;
    expect(customer).toBeDefined();
    expect(customer.full_name).toBe('Vikram Builder');
    expect(customer.password_hash).toBeUndefined(); // Customer table has no password
  });

  // 11. WhatsApp prefill URL contains reference and avoids customer address PII
  it('11. WhatsApp prefill URL contains reference ID without sensitive PII', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const payload = {
      material_id: 'prod_murum_04',
      quantity: 3,
      unit: 'Brass',
      delivery_address: 'Private Site Address 999, Secret Road, Nagpur',
      area_pincode: 'Wardha Road (440015)',
      preferred_delivery_date: tomorrow,
      customer_name: 'Anil Deshmukh',
      mobile_number: '9890123456',
    };

    const res = await request(app).post('/api/v1/orders/quote-request').send(payload);
    expect(res.status).toBe(201);
    const waUrl = res.body.data.whatsappDirectUrl;
    expect(waUrl).toContain('wa.me');
    expect(waUrl).toContain(res.body.data.orderReference);
    // Sensitive customer address should not be leaked in URL query param
    expect(waUrl).not.toContain('Private%20Site%20Address%20999');
  });

  // 12. Duplicate submission protection returns existing order
  it('12. Rapid identical submission returns existing order reference', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const payload = {
      material_id: 'prod_stone_03',
      quantity: 4,
      unit: 'Brass',
      delivery_address: 'Sector 5, MIHAN, Nagpur',
      area_pincode: 'MIHAN (441108)',
      preferred_delivery_date: tomorrow,
      customer_name: 'Sameer Construction',
      mobile_number: '9765432100',
    };

    // First submission
    const res1 = await request(app).post('/api/v1/orders/quote-request').send(payload);
    expect(res1.status).toBe(201);
    const firstRef = res1.body.data.orderReference;

    // Second immediate identical submission
    const res2 = await request(app).post('/api/v1/orders/quote-request').send(payload);
    expect(res2.status).toBe(200);
    expect(res2.body.data.orderReference).toBe(firstRef);
    expect(res2.body.data.message).toContain('already been received');
  });

  // 13. Public API security: Customer data and admin operations are protected
  it('13. Orders list and admin routes cannot be accessed without admin auth', async () => {
    const ordersRes = await request(app).get('/api/v1/orders');
    expect(ordersRes.status).toBe(401);

    const adminRes = await request(app).get('/api/v1/admin/dashboard/summary');
    expect(adminRes.status).toBe(401);
  });
});
