import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getDatabase, closeDatabase } from '../src/db/connection.js';
import { runMigrations } from '../src/db/migrate.js';
import { runSeeds } from '../src/db/seed.js';
import { config } from '../src/config/index.js';
import { Express } from 'express';

describe('Phase 0 Foundation & Architecture Tests', () => {
  let app: Express;

  beforeAll(() => {
    // Initialize in-memory or test database and run baseline migrations + seeds
    const db = getDatabase(':memory:');
    runMigrations(db);
    runSeeds(db);
    app = createApp();
  });

  afterAll(() => {
    closeDatabase();
  });

  // 1 & 2. Health & Readiness Endpoints
  describe('Health Checks', () => {
    it('1 & 2: Health check endpoint returns status UP and service metadata', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('UP');
      expect(res.body.data.service).toBe('nagpur-materials-marketplace-api');
      expect(res.body.meta.timestamp).toBeDefined();
    });

    it('3: Database readiness endpoint verifies database connection', async () => {
      const res = await request(app).get('/health/readiness');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('READY');
      expect(res.body.data.database).toBe('CONNECTED');
    });
  });

  // 4 & 5. Authentication Foundation
  describe('Authentication Foundation', () => {
    it('4: Valid admin credentials return JWT token and safe user profile', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: config.initialAdmin.email,
          password: config.initialAdmin.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(config.initialAdmin.email);
      expect(res.body.data.user.role).toBe('SUPER_ADMIN');
      expect(res.body.data.user.password_hash).toBeUndefined(); // PII security check
    });

    it('5: Invalid password rejects authentication with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: config.initialAdmin.email,
          password: 'IncorrectPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('5b: Nonexistent user rejects authentication with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'unknown@user.com',
          password: 'SomePassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  // 6 & 7. Protected Admin Routes & Role-Based Authorization
  describe('Protected Admin Routes & Authorization', () => {
    it('6: Unauthenticated access to protected admin route is rejected with 401', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard/summary');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('6b: Protected route accepts valid Bearer token', async () => {
      // Login first to get token
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: config.initialAdmin.email,
          password: config.initialAdmin.password,
        });
      const token = loginRes.body.data.token;

      const res = await request(app)
        .get('/api/v1/admin/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.activeProductsCount).toBe(4); // 4 MVP materials
    });

    it('7: Super Admin role can access system settings', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: config.initialAdmin.email,
          password: config.initialAdmin.password,
        });
      const token = loginRes.body.data.token;

      const res = await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.allowedRoles).toContain('SUPER_ADMIN');
    });
  });

  // 8. Request Validation
  describe('Validation Conventions', () => {
    it('8: Invalid quote request payload returns 400 with structured validation details', async () => {
      const res = await request(app)
        .post('/api/v1/orders/quote-request')
        .send({
          // Missing required fields (material_id, quantity, etc.)
          customer_name: '',
          mobile_number: 'invalid-phone',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);
    });

    it('8b: Valid quote request succeeds and generates order reference ID', async () => {
      const res = await request(app)
        .post('/api/v1/orders/quote-request')
        .send({
          material_id: 'prod_sand_01',
          quantity: 2,
          unit: 'Brass',
          delivery_address: 'Plot 45, Manish Nagar, Wardha Road',
          area_pincode: '440015',
          preferred_delivery_date: '2026-10-01',
          customer_name: 'Rajesh Sharma',
          mobile_number: '9876543210',
          additional_notes: 'Urgent morning delivery requested',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderReference).toMatch(/^NGP-\d{6}-\d{4}$/);
      expect(res.body.data.status).toBe('NEW');
      expect(res.body.data.whatsappDirectUrl).toBeDefined();
    });
  });

  // 9. Error Handling & 404 Response Format
  describe('Centralized Error Handling', () => {
    it('9: Unknown route returns clean 404 response without leaking internals', async () => {
      const res = await request(app).get('/api/v1/nonexistent-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.meta.timestamp).toBeDefined();
    });

    it('9b: Product catalog endpoint returns exactly the 4 MVP materials', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(4);
      const names = res.body.data.map((p: any) => p.name);
      expect(names).toContain('Sand');
      expect(names).toContain('Bricks');
      expect(names).toContain('Black Stone / Aggregate');
      expect(names).toContain('Murum');
    });
  });

  // 10. Decoupled Driver & Truck Entity Foundation
  describe('Decoupled Driver & Truck Foundation', () => {
    it('10: Decoupled Driver and Truck entities can be registered independently', async () => {
      const { DriverRepository } = await import('../src/repositories/driverRepository.js');
      const { TruckRepository } = await import('../src/repositories/truckRepository.js');
      const driverRepo = new DriverRepository();
      const truckRepo = new TruckRepository();

      const now = new Date().toISOString();
      const driverId = 'drv_test_01';
      driverRepo.create({
        id: driverId,
        full_name: 'Ramesh Patil',
        mobile_number: '9876543210',
        license_number: 'MH-31-2015-001234',
        verification_status: 'VERIFIED',
        availability_status: 'Available',
        notes: 'Experienced tipper driver',
        is_active: 1,
        created_at: now,
        updated_at: now,
      });

      const truckId = 'trk_test_01';
      truckRepo.create({
        id: truckId,
        registration_number: 'MH-31-AP-9999',
        capacity_tons: 16,
        supported_materials: JSON.stringify(['Sand', 'Black Stone / Aggregate']),
        owner_name: 'Nagpur Transport Co.',
        owner_mobile: '9822001122',
        default_driver_id: driverId,
        availability_status: 'Available',
        indicative_transport_rate: 1800,
        verification_status: 'VERIFIED',
        notes: '16-ton tipper vehicle',
        is_active: 1,
        created_at: now,
        updated_at: now,
      });

      const retrievedDriver = driverRepo.findById(driverId);
      const retrievedTruck = truckRepo.findById(truckId);

      expect(retrievedDriver).toBeDefined();
      expect(retrievedDriver?.full_name).toBe('Ramesh Patil');
      expect(retrievedTruck).toBeDefined();
      expect(retrievedTruck?.default_driver_id).toBe(driverId);
    });
  });
});
