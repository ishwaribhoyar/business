import { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../utils/response.js';
import { OrderRepository } from '../repositories/orderRepository.js';
import { ProductRepository } from '../repositories/productRepository.js';
import { SupplierRepository } from '../repositories/supplierRepository.js';
import { TruckRepository } from '../repositories/truckRepository.js';
import { DriverRepository } from '../repositories/driverRepository.js';

const orderRepo = new OrderRepository();
const productRepo = new ProductRepository();
const supplierRepo = new SupplierRepository();
const truckRepo = new TruckRepository();
const driverRepo = new DriverRepository();

export class AdminController {
  static getDashboardSummary(_req: Request, res: Response, next: NextFunction): void {
    try {
      const ordersResult = orderRepo.findAll({ limit: 1000 });
      const products = productRepo.findAllActive();
      const suppliers = supplierRepo.findAll();
      const trucks = truckRepo.findAll();
      const drivers = driverRepo.findAll();

      const ordersByStatus = ordersResult.orders.reduce<Record<string, number>>((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      const summary = {
        totalOrders: ordersResult.total,
        activeDeliveries: (ordersByStatus['OUT_FOR_DELIVERY'] || 0) + (ordersByStatus['LOADING'] || 0),
        completedOrders: ordersByStatus['COMPLETED'] || 0,
        newOrders: ordersByStatus['NEW'] || 0,
        activeProductsCount: products.length,
        registeredSuppliersCount: suppliers.length,
        registeredTrucksCount: trucks.length,
        registeredDriversCount: drivers.length,
        ordersByStatus,
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
        version: '1.0.0-phase0',
        allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
        serviceArea: 'Nagpur and nearby serviceable areas',
        mvpMaterials: ['Sand', 'Bricks', 'Black Stone / Aggregate', 'Murum'],
        pricingEngine: 'Manual Quotation First',
        humanAssistedOperations: true,
      });
    } catch (error) {
      next(error);
    }
  }
}
