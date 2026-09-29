import { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../utils/response.js';
import { OrderRepository } from '../repositories/orderRepository.js';
import { ProductRepository } from '../repositories/productRepository.js';
import { SupplierRepository } from '../repositories/supplierRepository.js';
import { TruckRepository } from '../repositories/truckRepository.js';
import { DriverRepository } from '../repositories/driverRepository.js';
import { PaymentRepository } from '../repositories/paymentRepository.js';
import { AuditLogRepository } from '../repositories/auditLogRepository.js';
import { AdminUserRepository } from '../repositories/adminUserRepository.js';
import { VariantRepository } from '../repositories/variantRepository.js';
import { SupplierService } from '../services/supplierService.js';
import { TruckService } from '../services/truckService.js';
import { DriverService } from '../services/driverService.js';
import { AuditService } from '../services/auditService.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import bcrypt from 'bcryptjs';

const orderRepo = new OrderRepository();
const productRepo = new ProductRepository();
const variantRepo = new VariantRepository();
const supplierRepo = new SupplierRepository();
const truckRepo = new TruckRepository();
const driverRepo = new DriverRepository();
const paymentRepo = new PaymentRepository();
const auditRepo = new AuditLogRepository();
const adminUserRepo = new AdminUserRepository();
const auditService = new AuditService();

const supplierService = new SupplierService(supplierRepo);
const truckService = new TruckService(truckRepo, driverRepo);
const driverService = new DriverService(driverRepo);

export class AdminController {
  // -------------------------------------------------------------
  // Dashboard & System Metrics (100% Real Database Aggregations)
  // -------------------------------------------------------------
  static async getDashboardSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await orderRepo.getDashboardMetrics();
      const legacyProducts = (await productRepo.findAllActive()) as any[];
      const activeVariants = (await variantRepo.findAllActive()) as any[];
      const activeProductsCount = legacyProducts.length > 0 ? legacyProducts.length : activeVariants.length;
      const suppliers = (await supplierRepo.findAll()) as any[];
      const trucks = (await truckRepo.findAll()) as any[];
      const drivers = (await driverRepo.findAll()) as any[];

      const recentOrders = await orderRepo.findAll({ limit: 6 });

      const summary = {
        totalOrders: metrics.totalOrders,
        newOrders: metrics.newOrders,
        activeDeliveries: metrics.activeDeliveries,
        completedOrders: metrics.completedOrders,
        totalRevenue: metrics.totalRevenue,
        totalDirectCosts: metrics.totalDirectCosts,
        grossMargin: metrics.grossMargin,
        ordersByStatus: metrics.ordersByStatus,
        activeProductsCount,
        registeredSuppliersCount: suppliers.length,
        registeredTrucksCount: trucks.length,
        registeredDriversCount: drivers.length,
        recentOrders: recentOrders.orders,
      };

      ResponseFormatter.success(res, summary);
    } catch (error) {
      next(error);
    }
  }

  static getSystemSettings(_req: Request, res: Response, next: NextFunction): void {
    try {
      ResponseFormatter.success(res, {
        system: 'Nagpur Building Materials Platform MVP',
        version: '2.0.0-phase2',
        allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
        serviceArea: 'Nagpur and currently serviceable nearby areas',
        mvpMaterials: ['Sand', 'Bricks', 'Black Stone / Aggregate', 'Murum'],
        pricingEngine: 'Manual Quotation First',
        humanAssistedOperations: true,
      });
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // Suppliers Management
  // -------------------------------------------------------------
  static async getSuppliers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const suppliers = await supplierService.getAllSuppliers();
      ResponseFormatter.success(res, suppliers);
    } catch (error) {
      next(error);
    }
  }

  static async getSupplierById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const supplier = await supplierService.getSupplierById(id);
      if (!supplier) {
        throw new NotFoundError(`Supplier '${id}'`);
      }
      ResponseFormatter.success(res, supplier);
    } catch (error) {
      next(error);
    }
  }

  static async createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const supplier = await supplierService.createSupplier(req.body, user.id, user.email);
      ResponseFormatter.success(res, supplier, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const user = (req as any).user;
      const supplier = await supplierService.updateSupplier(id, req.body, user.id, user.email);
      ResponseFormatter.success(res, supplier);
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // Trucks Management
  // -------------------------------------------------------------
  static async getTrucks(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trucks = await truckService.getAllTrucks();
      ResponseFormatter.success(res, trucks);
    } catch (error) {
      next(error);
    }
  }

  static async getTruckById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const truck = await truckService.getTruckById(id);
      if (!truck) {
        throw new NotFoundError(`Truck '${id}'`);
      }
      ResponseFormatter.success(res, truck);
    } catch (error) {
      next(error);
    }
  }

  static async createTruck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const truck = await truckService.createTruck(req.body, user.id, user.email);
      ResponseFormatter.success(res, truck, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateTruck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const user = (req as any).user;
      const truck = await truckService.updateTruck(id, req.body, user.id, user.email);
      ResponseFormatter.success(res, truck);
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // Drivers Management
  // -------------------------------------------------------------
  static async getDrivers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const drivers = await driverService.getAllDrivers();
      ResponseFormatter.success(res, drivers);
    } catch (error) {
      next(error);
    }
  }

  static async getDriverById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const driver = await driverService.getDriverById(id);
      if (!driver) {
        throw new NotFoundError(`Driver '${id}'`);
      }
      ResponseFormatter.success(res, driver);
    } catch (error) {
      next(error);
    }
  }

  static async createDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const driver = await driverService.createDriver(req.body, user.id, user.email);
      ResponseFormatter.success(res, driver, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const user = (req as any).user;
      const driver = await driverService.updateDriver(id, req.body, user.id, user.email);
      ResponseFormatter.success(res, driver);
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // Payments & Ledger
  // -------------------------------------------------------------
  static async getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const result = await paymentRepo.findAll(limit, offset);
      ResponseFormatter.success(res, result.payments, 200, {
        total: result.total,
        limit,
        page: Math.floor(offset / limit) + 1,
      });
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // Audit Logs
  // -------------------------------------------------------------
  static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const result = await auditRepo.findAll(limit, offset);
      ResponseFormatter.success(res, result.logs, 200, {
        total: result.total,
        limit,
      });
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // Multi-Admin User Management (SUPER_ADMIN Only)
  // -------------------------------------------------------------
  static async getAdminUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = (await adminUserRepo.findAll()) as any[];
      // Sanitize: never expose password_hash
      const safeUsers = users.map((u) => {
        const { password_hash, ...safe } = u;
        return safe;
      });
      ResponseFormatter.success(res, safeUsers);
    } catch (error) {
      next(error);
    }
  }

  static async createAdminUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, full_name, role } = req.body;
      const actor = req.user;

      // Check existing email
      const existing = await adminUserRepo.findByEmail(email);
      if (existing) {
        throw new ValidationError(`An admin user with email '${email}' already exists.`);
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      const now = new Date().toISOString();
      const newId = `usr_admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const newUser = {
        id: newId,
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        full_name: full_name.trim(),
        role: role || 'ADMIN',
        is_active: 1,
        created_at: now,
        updated_at: now,
      };

      await adminUserRepo.create(newUser);

      // Audit log
      auditService.log({
        userId: actor?.id || 'SYSTEM',
        action: 'ADMIN_USER_CREATED',
        entityType: 'ADMIN_USER',
        entityId: newId,
        changes: { email: newUser.email, role: newUser.role, full_name: newUser.full_name },
        ipAddress: req.ip,
      });

      const { password_hash: _, ...safeUser } = newUser;
      ResponseFormatter.success(res, safeUser, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateAdminUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { is_active } = req.body;
      const actor = req.user;

      const targetUser = await adminUserRepo.findById(id);
      if (!targetUser) {
        throw new NotFoundError(`Admin user with ID '${id}'`);
      }

      // Prevent self-deactivation
      if (actor && actor.id === id && is_active === 0) {
        throw new ValidationError('You cannot deactivate your own administrative account.');
      }

      // Prevent deactivating the only active SUPER_ADMIN
      if (targetUser.role === 'SUPER_ADMIN' && is_active === 0) {
        const allUsers = (await adminUserRepo.findAll()) as any[];
        const activeSuperAdmins = allUsers.filter((u) => u.role === 'SUPER_ADMIN' && (u.is_active === 1 || (u.is_active as any) === true));
        if (activeSuperAdmins.length <= 1) {
          throw new ValidationError('Cannot deactivate the sole active Super Admin in the system.');
        }
      }

      const now = new Date().toISOString();
      await adminUserRepo.updateStatus(id, is_active, now);

      auditService.log({
        userId: actor?.id || 'SYSTEM',
        action: 'ADMIN_USER_STATUS_UPDATED',
        entityType: 'ADMIN_USER',
        entityId: id,
        changes: { previous_active: targetUser.is_active, new_active: is_active },
        ipAddress: req.ip,
      });

      ResponseFormatter.success(res, {
        id,
        is_active,
        updated_at: now,
        message: `Admin user '${targetUser.email}' status successfully updated.`,
      });
    } catch (error) {
      next(error);
    }
  }
}
