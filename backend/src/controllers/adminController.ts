import { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../utils/response.js';
import { OrderRepository } from '../repositories/orderRepository.js';
import { ProductRepository } from '../repositories/productRepository.js';
import { SupplierRepository } from '../repositories/supplierRepository.js';
import { TruckRepository } from '../repositories/truckRepository.js';
import { DriverRepository } from '../repositories/driverRepository.js';
import { PaymentRepository } from '../repositories/paymentRepository.js';
import { AuditLogRepository } from '../repositories/auditLogRepository.js';
import { SupplierService } from '../services/supplierService.js';
import { TruckService } from '../services/truckService.js';
import { DriverService } from '../services/driverService.js';
import { NotFoundError } from '../utils/errors.js';

const orderRepo = new OrderRepository();
const productRepo = new ProductRepository();
const supplierRepo = new SupplierRepository();
const truckRepo = new TruckRepository();
const driverRepo = new DriverRepository();
const paymentRepo = new PaymentRepository();
const auditRepo = new AuditLogRepository();

const supplierService = new SupplierService(supplierRepo);
const truckService = new TruckService(truckRepo, driverRepo);
const driverService = new DriverService(driverRepo);

export class AdminController {
  // -------------------------------------------------------------
  // Dashboard & System Metrics (100% Real Database Aggregations)
  // -------------------------------------------------------------
  static getDashboardSummary(_req: Request, res: Response, next: NextFunction): void {
    try {
      const metrics = orderRepo.getDashboardMetrics();
      const products = productRepo.findAllActive();
      const suppliers = supplierRepo.findAll();
      const trucks = truckRepo.findAll();
      const drivers = driverRepo.findAll();

      const recentOrders = orderRepo.findAll({ limit: 6 });

      const summary = {
        totalOrders: metrics.totalOrders,
        newOrders: metrics.newOrders,
        activeDeliveries: metrics.activeDeliveries,
        completedOrders: metrics.completedOrders,
        totalRevenue: metrics.totalRevenue,
        totalDirectCosts: metrics.totalDirectCosts,
        grossMargin: metrics.grossMargin,
        ordersByStatus: metrics.ordersByStatus,
        activeProductsCount: products.length,
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
  static getSuppliers(_req: Request, res: Response, next: NextFunction): void {
    try {
      const suppliers = supplierService.getAllSuppliers();
      ResponseFormatter.success(res, suppliers);
    } catch (error) {
      next(error);
    }
  }

  static getSupplierById(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const supplier = supplierService.getSupplierById(id);
      if (!supplier) {
        throw new NotFoundError(`Supplier '${id}'`);
      }
      ResponseFormatter.success(res, supplier);
    } catch (error) {
      next(error);
    }
  }

  static createSupplier(req: Request, res: Response, next: NextFunction): void {
    try {
      const user = (req as any).user;
      const supplier = supplierService.createSupplier(req.body, user.id, user.email);
      ResponseFormatter.success(res, supplier, 201);
    } catch (error) {
      next(error);
    }
  }

  static updateSupplier(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const user = (req as any).user;
      const supplier = supplierService.updateSupplier(id, req.body, user.id, user.email);
      ResponseFormatter.success(res, supplier);
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // Trucks Management
  // -------------------------------------------------------------
  static getTrucks(_req: Request, res: Response, next: NextFunction): void {
    try {
      const trucks = truckService.getAllTrucks();
      ResponseFormatter.success(res, trucks);
    } catch (error) {
      next(error);
    }
  }

  static getTruckById(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const truck = truckService.getTruckById(id);
      if (!truck) {
        throw new NotFoundError(`Truck '${id}'`);
      }
      ResponseFormatter.success(res, truck);
    } catch (error) {
      next(error);
    }
  }

  static createTruck(req: Request, res: Response, next: NextFunction): void {
    try {
      const user = (req as any).user;
      const truck = truckService.createTruck(req.body, user.id, user.email);
      ResponseFormatter.success(res, truck, 201);
    } catch (error) {
      next(error);
    }
  }

  static updateTruck(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const user = (req as any).user;
      const truck = truckService.updateTruck(id, req.body, user.id, user.email);
      ResponseFormatter.success(res, truck);
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // Drivers Management
  // -------------------------------------------------------------
  static getDrivers(_req: Request, res: Response, next: NextFunction): void {
    try {
      const drivers = driverService.getAllDrivers();
      ResponseFormatter.success(res, drivers);
    } catch (error) {
      next(error);
    }
  }

  static getDriverById(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const driver = driverService.getDriverById(id);
      if (!driver) {
        throw new NotFoundError(`Driver '${id}'`);
      }
      ResponseFormatter.success(res, driver);
    } catch (error) {
      next(error);
    }
  }

  static createDriver(req: Request, res: Response, next: NextFunction): void {
    try {
      const user = (req as any).user;
      const driver = driverService.createDriver(req.body, user.id, user.email);
      ResponseFormatter.success(res, driver, 201);
    } catch (error) {
      next(error);
    }
  }

  static updateDriver(req: Request, res: Response, next: NextFunction): void {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const user = (req as any).user;
      const driver = driverService.updateDriver(id, req.body, user.id, user.email);
      ResponseFormatter.success(res, driver);
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // Payments & Ledger
  // -------------------------------------------------------------
  static getPayments(req: Request, res: Response, next: NextFunction): void {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const result = paymentRepo.findAll(limit, offset);
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
  static getAuditLogs(req: Request, res: Response, next: NextFunction): void {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const result = auditRepo.findAll(limit, offset);
      ResponseFormatter.success(res, result.logs, 200, {
        total: result.total,
        limit,
      });
    } catch (error) {
      next(error);
    }
  }
}
