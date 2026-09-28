import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getDatabase, closeDatabase } from '../src/db/connection.js';
import { runMigrations } from '../src/db/migrate.js';
import { runSeeds } from '../src/db/seed.js';
import { Express } from 'express';

describe('Phase 3 Hierarchical Material Catalog & Variant Quote Flow Tests', () => {
  let app: Express;
  let adminToken: string;

  beforeAll(async () => {
    const db = getDatabase(':memory:');
    runMigrations(db);
    runSeeds(db);
    app = createApp();

    // Authenticate as default Super Admin
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
  // 1. Category Listing & Slug Endpoints
  // -------------------------------------------------------------
  describe('Category Listing & Discovery', () => {
    it('1. GET /api/v1/catalog/categories returns all 4 active top-level categories', async () => {
      const res = await request(app).get('/api/v1/catalog/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(4);

      const slugs = res.body.data.map((c: any) => c.slug);
      expect(slugs).toContain('sand');
      expect(slugs).toContain('bricks');
      expect(slugs).toContain('black-stone-aggregate');
      expect(slugs).toContain('murum');
    });

    it('2. GET /api/v1/catalog/categories/:slug returns category with its active variants', async () => {
      const res = await request(app).get('/api/v1/catalog/categories/sand');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Sand');
      expect(Array.isArray(res.body.data.variants)).toBe(true);
      expect(res.body.data.variants.length).toBeGreaterThanOrEqual(2);

      const varSlugs = res.body.data.variants.map((v: any) => v.slug);
      expect(varSlugs).toContain('river-sand');
      expect(varSlugs).toContain('m-sand');
    });

    it('3. GET /api/v1/catalog/categories/:slug resolves aliases (aggregate -> black-stone-aggregate)', async () => {
      const res = await request(app).get('/api/v1/catalog/categories/aggregate');
      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe('black-stone-aggregate');
    });

    it('4. GET /api/v1/catalog/categories/:slug returns 404 for nonexistent category', async () => {
      const res = await request(app).get('/api/v1/catalog/categories/nonexistent-cement');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // -------------------------------------------------------------
  // 2. Variant Discovery & Specifications Schema
  // -------------------------------------------------------------
  describe('Variant Discovery & Dynamic Specifications Schema', () => {
    it('5. GET /api/v1/catalog/categories/:categorySlug/variants returns variants list', async () => {
      const res = await request(app).get('/api/v1/catalog/categories/bricks/variants');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const varNames = res.body.data.map((v: any) => v.name);
      expect(varNames).toContain('Red Clay Bricks');
      expect(varNames).toContain('Fly Ash Bricks');
    });

    it('6. GET /api/v1/catalog/categories/:categorySlug/variants/:variantSlug returns variant details with parsed specifications schema', async () => {
      const res = await request(app).get('/api/v1/catalog/categories/sand/variants/river-sand');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('River Sand');
      expect(res.body.data.unit).toBe('Brass');
      expect(res.body.data.min_quantity).toBe(1);
      expect(Array.isArray(res.body.data.parsed_specifications)).toBe(true);

      const siltField = res.body.data.parsed_specifications.find((f: any) => f.key === 'silt_grade');
      expect(siltField).toBeDefined();
      expect(siltField.required).toBe(true);
      expect(siltField.options).toContain('Standard Screened Sand');
      expect(siltField.options).toContain('Double Washed Plaster Sand');
    });

    it('7. GET /api/v1/catalog/variants/:id retrieves variant by unique ID', async () => {
      const res = await request(app).get('/api/v1/catalog/variants/var_brick_red');
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Red Clay Bricks');
      expect(res.body.data.unit).toBe('Pieces');
      expect(res.body.data.min_quantity).toBe(1000);
    });
  });

  // -------------------------------------------------------------
  // 3. Validation Logic (Quantity, Minimums, Units, Specifications)
  // -------------------------------------------------------------
  describe('Variant & Specification Validation Rules', () => {
    it('8. Rejects quote request when required specification is missing', async () => {
      const res = await request(app).post('/api/v1/orders/quote-request').send({
        variant_id: 'var_sand_river',
        quantity: 3,
        unit: 'Brass',
        delivery_address: 'Plot 10, Civil Lines, Nagpur',
        area_pincode: '440001',
        preferred_delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        customer_name: 'Civil Tech Infra',
        mobile_number: '9876543210',
        specifications: {}, // missing required silt_grade
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Washing & Silt Grade');
    });

    it('9. Rejects quote request with invalid specification option', async () => {
      const res = await request(app).post('/api/v1/orders/quote-request').send({
        variant_id: 'var_sand_river',
        quantity: 3,
        unit: 'Brass',
        delivery_address: 'Plot 10, Civil Lines, Nagpur',
        area_pincode: '440001',
        preferred_delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        customer_name: 'Civil Tech Infra',
        mobile_number: '9876543210',
        specifications: {
          silt_grade: 'Unscreened Muddy Sand (Invalid Option)',
        },
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid option');
    });

    it('10. Rejects quote request when quantity is below minimum requirement', async () => {
      // Bricks min quantity is 1000 pieces
      const res = await request(app).post('/api/v1/orders/quote-request').send({
        variant_id: 'var_brick_red',
        quantity: 500, // Below 1000
        unit: 'Pieces',
        delivery_address: 'Survey 22, Manewada Road, Nagpur',
        area_pincode: '440024',
        preferred_delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        customer_name: 'Apex Constructions',
        mobile_number: '9876543211',
        specifications: {
          brick_class: 'Class A (Standard Kiln Burnt)',
        },
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Minimum order quantity');
    });

    it('11. Rejects quote request with incompatible unit', async () => {
      // Bricks unit must be Pieces, not Brass
      const res = await request(app).post('/api/v1/orders/quote-request').send({
        variant_id: 'var_brick_red',
        quantity: 2000,
        unit: 'Brass', // Invalid unit for bricks
        delivery_address: 'Survey 22, Manewada Road, Nagpur',
        area_pincode: '440024',
        preferred_delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        customer_name: 'Apex Constructions',
        mobile_number: '9876543211',
        specifications: {
          brick_class: 'Class A (Standard Kiln Burnt)',
        },
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('not compatible');
    });
  });

  // -------------------------------------------------------------
  // 4. Successful Hierarchical Quote Request & WhatsApp Integration
  // -------------------------------------------------------------
  describe('Hierarchical Quote Request Submission & WhatsApp Integration', () => {
    it('12. Successfully creates quote request with category, variant, and specifications', async () => {
      const res = await request(app).post('/api/v1/orders/quote-request').send({
        variant_id: 'var_sand_river',
        quantity: 4,
        unit: 'Brass',
        delivery_address: 'Plot 44, Hingna Road, Near MIDC, Nagpur',
        area_pincode: '440016',
        preferred_delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        customer_name: 'Nagpur Developers Pvt Ltd',
        mobile_number: '9876543212',
        specifications: {
          silt_grade: 'Double Washed Plaster Sand',
        },
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderReference).toMatch(/^NGP-\d{6}-\d{4}$/);
      expect(res.body.data.status).toBe('NEW');
      expect(res.body.data.whatsappDirectUrl).toBeDefined();

      // Verify WhatsApp prefill contains variant, category, and specifications
      const decodedWaUrl = decodeURIComponent(res.body.data.whatsappDirectUrl);
      expect(decodedWaUrl).toContain('River Sand');
      expect(decodedWaUrl).toContain('Sand');
      expect(decodedWaUrl).toContain('Double Washed Plaster Sand');
      expect(decodedWaUrl).toContain('4 Brass');
      expect(decodedWaUrl).toContain('440016');

      // Verify order stored in database has snapshots
      const orderRes = await request(app)
        .get(`/api/v1/orders/${res.body.data.orderId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(orderRes.status).toBe(200);
      expect(orderRes.body.data.order.category_name_snapshot).toBe('Sand');
      expect(orderRes.body.data.order.variant_name_snapshot).toBe('River Sand');
      expect(orderRes.body.data.order.specifications_snapshot).toBeDefined();
      const parsedSpecs = JSON.parse(orderRes.body.data.order.specifications_snapshot);
      expect(parsedSpecs.silt_grade).toBe('Double Washed Plaster Sand');
    });
  });

  // -------------------------------------------------------------
  // 5. Historical Snapshot Integrity & Protection Against Master Data Edits
  // -------------------------------------------------------------
  describe('Historical Snapshotting & Catalog Mutability Invariance', () => {
    it('13. Guarantees catalog master edits or price changes do not rewrite historical order snapshots', async () => {
      // 1. Submit order for 20mm Black Stone Metal
      const quoteRes = await request(app).post('/api/v1/orders/quote-request').send({
        variant_id: 'var_stone_20mm',
        quantity: 5,
        unit: 'Brass',
        delivery_address: 'Site 88, Besa Road, Nagpur',
        area_pincode: '440037',
        preferred_delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        customer_name: 'Besa Residential Project',
        mobile_number: '9876543213',
        specifications: {
          crusher_type: 'Cone Crusher (Cubical)',
        },
      });

      expect(quoteRes.status).toBe(201);
      const orderId = quoteRes.body.data.orderId;

      // 2. Admin issues quotation for this order
      await request(app)
        .post(`/api/v1/orders/${orderId}/quotations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          material_cost: 15000,
          transport_cost: 3000,
          platform_fee: 1500,
          discount: 500,
          validity_date: '2026-11-01',
        });

      // 3. Mutate master variant record (change name, change min quantity, deactivate)
      const updateRes = await request(app)
        .patch('/api/v1/admin/catalog/variants/var_stone_20mm')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Renamed 20mm Super Metal',
          min_quantity: 10,
          indicative_price: 99999,
          is_active: 0, // deactivated!
        });

      expect(updateRes.status).toBe(200);

      // 4. Fetch the historical order and verify snapshots remain 100% untouched
      const histOrderRes = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(histOrderRes.status).toBe(200);
      expect(histOrderRes.body.data.order.category_name_snapshot).toBe('Black Stone / Aggregate');
      expect(histOrderRes.body.data.order.variant_name_snapshot).toBe('20mm Black Stone Metal');
      expect(histOrderRes.body.data.order.quantity).toBe(5);
      expect(histOrderRes.body.data.order.unit).toBe('Brass');

      // 5. Inactive variant can no longer be ordered by customers
      const failNewOrderRes = await request(app).post('/api/v1/orders/quote-request').send({
        variant_id: 'var_stone_20mm',
        quantity: 5,
        unit: 'Brass',
        delivery_address: 'Site 88, Besa Road, Nagpur',
        area_pincode: '440037',
        preferred_delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        customer_name: 'Besa Residential Project',
        mobile_number: '9876543213',
      });

      expect(failNewOrderRes.status).toBe(400);
      expect(failNewOrderRes.body.error.message).toContain('inactive');

      // 6. Restore variant active state for remaining tests
      await request(app)
        .patch('/api/v1/admin/catalog/variants/var_stone_20mm')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '20mm Black Stone Metal',
          min_quantity: 1,
          is_active: 1,
        });
    });
  });

  // -------------------------------------------------------------
  // 6. Admin Catalog Management
  // -------------------------------------------------------------
  describe('Admin Catalog Management Operations', () => {
    it('14. Admin can list all categories and variants', async () => {
      const catRes = await request(app)
        .get('/api/v1/admin/catalog/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(catRes.status).toBe(200);
      expect(catRes.body.data.length).toBeGreaterThanOrEqual(4);

      const varRes = await request(app)
        .get('/api/v1/admin/catalog/variants')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(varRes.status).toBe(200);
      expect(varRes.body.data.length).toBeGreaterThanOrEqual(10);
    });

    it('15. Admin can create and update a new product variant with specifications schema', async () => {
      const newVarRes = await request(app)
        .post('/api/v1/admin/catalog/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category_id: 'cat_murum_04',
          name: 'Special Road Bed Murum',
          slug: 'special-road-murum',
          short_description: 'Coarse graded road bed murum for heavy highway construction.',
          unit: 'Brass',
          min_quantity: 2,
          indicative_price: 3500,
          specifications_schema: [
            {
              key: 'compaction_grade',
              label: 'Compaction Grade',
              type: 'select',
              required: true,
              options: ['Grade 1 (Highway)', 'Grade 2 (Internal Road)'],
            },
          ],
          display_order: 10,
        });

      expect(newVarRes.status).toBe(201);
      expect(newVarRes.body.data.slug).toBe('special-road-murum');
      expect(newVarRes.body.data.unit).toBe('Brass');
      expect(newVarRes.body.data.indicative_price).toBe(3500);

      const varId = newVarRes.body.data.id;

      // Update variant
      const updateRes = await request(app)
        .patch(`/api/v1/admin/catalog/variants/${varId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          min_quantity: 3,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.min_quantity).toBe(3);
    });

    it('16. Admin can filter orders by category and variant in GET /api/v1/orders', async () => {
      const filterRes = await request(app)
        .get('/api/v1/orders?category_id=cat_sand_01')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(filterRes.status).toBe(200);
      expect(Array.isArray(filterRes.body.data)).toBe(true);
      for (const order of filterRes.body.data) {
        expect(['Sand', 'cat_sand_01']).toContain(order.category_name || order.category_id);
      }
    });
  });
});
