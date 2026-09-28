import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { CatalogController } from '../controllers/catalogController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  supplierCreateSchema,
  supplierUpdateSchema,
  truckCreateSchema,
  truckUpdateSchema,
  driverCreateSchema,
  driverUpdateSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  variantCreateSchema,
  variantUpdateSchema,
  adminUserCreateSchema,
  adminUserStatusSchema,
} from '../schemas/index.js';

const router = Router();
const adminAuth = [authenticate, authorize('ADMIN', 'SUPER_ADMIN')];
const superAdminAuth = [authenticate, authorize('SUPER_ADMIN')];

// -----------------------------------------------------------------------------
// Operations Dashboard & Settings
// -----------------------------------------------------------------------------
router.get('/dashboard/summary', ...adminAuth, AdminController.getDashboardSummary);
router.get('/settings', ...superAdminAuth, AdminController.getSystemSettings);

// -----------------------------------------------------------------------------
// Multi-Admin User Management (SUPER_ADMIN Only)
// -----------------------------------------------------------------------------
router.get('/users', ...superAdminAuth, AdminController.getAdminUsers);
router.post('/users', ...superAdminAuth, validate(adminUserCreateSchema), AdminController.createAdminUser);
router.patch('/users/:id/status', ...superAdminAuth, validate(adminUserStatusSchema), AdminController.updateAdminUserStatus);


// -----------------------------------------------------------------------------
// Material Catalog Management (Phase 3 Categories & Variants)
// -----------------------------------------------------------------------------
router.get('/catalog/categories', ...adminAuth, CatalogController.getAdminCategories);
router.post('/catalog/categories', ...adminAuth, validate(categoryCreateSchema), CatalogController.createCategory);
router.patch('/catalog/categories/:id', ...adminAuth, validate(categoryUpdateSchema), CatalogController.updateCategory);

router.get('/catalog/variants', ...adminAuth, CatalogController.getAdminVariants);
router.post('/catalog/variants', ...adminAuth, validate(variantCreateSchema), CatalogController.createVariant);
router.patch('/catalog/variants/:id', ...adminAuth, validate(variantUpdateSchema), CatalogController.updateVariant);

// -----------------------------------------------------------------------------
// Suppliers Management
// -----------------------------------------------------------------------------
router.get('/suppliers', ...adminAuth, AdminController.getSuppliers);
router.get('/suppliers/:id', ...adminAuth, AdminController.getSupplierById);
router.post('/suppliers', ...adminAuth, validate(supplierCreateSchema), AdminController.createSupplier);
router.patch('/suppliers/:id', ...adminAuth, validate(supplierUpdateSchema), AdminController.updateSupplier);

// -----------------------------------------------------------------------------
// Trucks Management
// -----------------------------------------------------------------------------
router.get('/trucks', ...adminAuth, AdminController.getTrucks);
router.get('/trucks/:id', ...adminAuth, AdminController.getTruckById);
router.post('/trucks', ...adminAuth, validate(truckCreateSchema), AdminController.createTruck);
router.patch('/trucks/:id', ...adminAuth, validate(truckUpdateSchema), AdminController.updateTruck);

// -----------------------------------------------------------------------------
// Drivers Management
// -----------------------------------------------------------------------------
router.get('/drivers', ...adminAuth, AdminController.getDrivers);
router.get('/drivers/:id', ...adminAuth, AdminController.getDriverById);
router.post('/drivers', ...adminAuth, validate(driverCreateSchema), AdminController.createDriver);
router.patch('/drivers/:id', ...adminAuth, validate(driverUpdateSchema), AdminController.updateDriver);

// -----------------------------------------------------------------------------
// Payments & Audit Logs
// -----------------------------------------------------------------------------
router.get('/payments', ...adminAuth, AdminController.getPayments);
router.get('/audit-logs', ...adminAuth, AdminController.getAuditLogs);

export default router;
