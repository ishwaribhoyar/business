import { OrderRepository } from '../repositories/orderRepository.js';
import { SupplierRepository } from '../repositories/supplierRepository.js';
import { TruckRepository } from '../repositories/truckRepository.js';
import { DriverRepository } from '../repositories/driverRepository.js';
import { ProductRepository } from '../repositories/productRepository.js';
import { AuditService } from '../services/auditService.js';
import { Order } from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { getDatabase } from '../db/connection.js';

export interface AssignFulfillmentContext {
  orderId: string;
  supplierId?: string | null;
  truckId?: string | null;
  driverId?: string | null;
  userId: string;
  userName: string;
  ipAddress?: string;
  notes?: string;
}

export class FulfillmentService {
  private orderRepo: OrderRepository;
  private supplierRepo: SupplierRepository;
  private truckRepo: TruckRepository;
  private driverRepo: DriverRepository;
  private productRepo: ProductRepository;
  private auditService: AuditService;

  constructor(
    orderRepo = new OrderRepository(),
    supplierRepo = new SupplierRepository(),
    truckRepo = new TruckRepository(),
    driverRepo = new DriverRepository(),
    productRepo = new ProductRepository(),
    auditService = new AuditService()
  ) {
    this.orderRepo = orderRepo;
    this.supplierRepo = supplierRepo;
    this.truckRepo = truckRepo;
    this.driverRepo = driverRepo;
    this.productRepo = productRepo;
    this.auditService = auditService;
  }

  assignSupplier(context: {
    orderId: string;
    supplierId: string;
    userId: string;
    userName: string;
    ipAddress?: string;
  }): Order {
    const order = this.orderRepo.findById(context.orderId);
    if (!order) {
      throw new NotFoundError(`Order '${context.orderId}'`);
    }

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new ValidationError(`Cannot assign supplier to an order in '${order.status}' status.`);
    }

    const supplier = this.supplierRepo.findById(context.supplierId);
    if (!supplier) {
      throw new NotFoundError(`Supplier '${context.supplierId}'`);
    }

    if (!supplier.is_active) {
      throw new ValidationError(`Supplier '${supplier.business_name}' is inactive and cannot be assigned.`);
    }

    const db = getDatabase();
    db.exec('BEGIN IMMEDIATE;');
    try {
      this.orderRepo.updateSupplier(order.id, supplier.id);

      this.auditService.recordAction({
        userId: context.userId,
        action: 'SUPPLIER_ASSIGNED',
        entityType: 'ORDER',
        entityId: order.id,
        changes: {
          supplierId: supplier.id,
          supplierName: supplier.business_name,
          assignedBy: context.userName,
        },
        ipAddress: context.ipAddress,
      });

      db.exec('COMMIT;');
      return this.orderRepo.findById(order.id)!;
    } catch (error) {
      try {
        db.exec('ROLLBACK;');
      } catch {}
      throw error;
    }
  }

  assignTruck(context: {
    orderId: string;
    truckId: string;
    autoAssignDefaultDriver?: boolean;
    userId: string;
    userName: string;
    ipAddress?: string;
  }): { order: Order; warnings: string[] } {
    const order = this.orderRepo.findById(context.orderId);
    if (!order) {
      throw new NotFoundError(`Order '${context.orderId}'`);
    }

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new ValidationError(`Cannot assign truck to an order in '${order.status}' status.`);
    }

    const truck = this.truckRepo.findById(context.truckId);
    if (!truck) {
      throw new NotFoundError(`Truck '${context.truckId}'`);
    }

    if (!truck.is_active) {
      throw new ValidationError(`Truck '${truck.registration_number}' is inactive.`);
    }

    const warnings: string[] = [];
    if (truck.availability_status !== 'Available') {
      warnings.push(`Truck '${truck.registration_number}' is currently marked as '${truck.availability_status}'.`);
    }

    const db = getDatabase();
    db.exec('BEGIN IMMEDIATE;');
    try {
      this.orderRepo.updateTruck(order.id, truck.id);

      // Optionally auto-assign truck's default driver if order has no driver assigned
      if (context.autoAssignDefaultDriver && truck.default_driver_id && !order.driver_id) {
        const defaultDriver = this.driverRepo.findById(truck.default_driver_id);
        if (defaultDriver && defaultDriver.is_active) {
          this.orderRepo.updateDriver(order.id, defaultDriver.id);
          this.auditService.recordAction({
            userId: context.userId,
            action: 'DRIVER_ASSIGNED',
            entityType: 'ORDER',
            entityId: order.id,
            changes: {
              driverId: defaultDriver.id,
              driverName: defaultDriver.full_name,
              reason: 'Auto-assigned default driver of assigned truck',
              assignedBy: context.userName,
            },
            ipAddress: context.ipAddress,
          });
        }
      }

      this.auditService.recordAction({
        userId: context.userId,
        action: 'TRUCK_ASSIGNED',
        entityType: 'ORDER',
        entityId: order.id,
        changes: {
          truckId: truck.id,
          registrationNumber: truck.registration_number,
          assignedBy: context.userName,
        },
        ipAddress: context.ipAddress,
      });

      db.exec('COMMIT;');
      return { order: this.orderRepo.findById(order.id)!, warnings };
    } catch (error) {
      try {
        db.exec('ROLLBACK;');
      } catch {}
      throw error;
    }
  }

  assignDriver(context: {
    orderId: string;
    driverId: string;
    userId: string;
    userName: string;
    ipAddress?: string;
  }): { order: Order; warnings: string[] } {
    const order = this.orderRepo.findById(context.orderId);
    if (!order) {
      throw new NotFoundError(`Order '${context.orderId}'`);
    }

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new ValidationError(`Cannot assign driver to an order in '${order.status}' status.`);
    }

    const driver = this.driverRepo.findById(context.driverId);
    if (!driver) {
      throw new NotFoundError(`Driver '${context.driverId}'`);
    }

    if (!driver.is_active) {
      throw new ValidationError(`Driver '${driver.full_name}' is inactive.`);
    }

    const warnings: string[] = [];
    if (driver.availability_status !== 'Available') {
      warnings.push(`Driver '${driver.full_name}' is currently marked as '${driver.availability_status}'.`);
    }

    const db = getDatabase();
    db.exec('BEGIN IMMEDIATE;');
    try {
      this.orderRepo.updateDriver(order.id, driver.id);

      this.auditService.recordAction({
        userId: context.userId,
        action: 'DRIVER_ASSIGNED',
        entityType: 'ORDER',
        entityId: order.id,
        changes: {
          driverId: driver.id,
          driverName: driver.full_name,
          assignedBy: context.userName,
        },
        ipAddress: context.ipAddress,
      });

      db.exec('COMMIT;');
      return { order: this.orderRepo.findById(order.id)!, warnings };
    } catch (error) {
      try {
        db.exec('ROLLBACK;');
      } catch {}
      throw error;
    }
  }
}
