import { DriverRepository } from '../repositories/driverRepository.js';
import { AuditService } from '../services/auditService.js';
import { Driver, TruckAvailability, VerificationStatus } from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export interface CreateDriverInput {
  full_name: string;
  mobile_number: string;
  license_number?: string;
  verification_status?: VerificationStatus;
  availability_status?: TruckAvailability;
  notes?: string;
}

export class DriverService {
  private driverRepo: DriverRepository;
  private auditService: AuditService;

  constructor(driverRepo = new DriverRepository(), auditService = new AuditService()) {
    this.driverRepo = driverRepo;
    this.auditService = auditService;
  }

  createDriver(input: CreateDriverInput, adminId: string, adminName: string): Driver {
    if (!input.full_name || input.full_name.trim().length < 2) {
      throw new ValidationError('Driver full name must be at least 2 characters.');
    }
    if (!input.mobile_number || !/^[6-9]\d{9}$/.test(input.mobile_number.replace(/\D/g, '').slice(-10))) {
      throw new ValidationError('A valid 10-digit Indian driver mobile number is required.');
    }

    const now = new Date().toISOString();
    const id = `drv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const driver: Driver = {
      id,
      full_name: input.full_name.trim(),
      mobile_number: input.mobile_number.replace(/\D/g, '').slice(-10),
      license_number: input.license_number ? input.license_number.trim().toUpperCase() : null,
      verification_status: input.verification_status || 'PENDING',
      availability_status: input.availability_status || 'Available',
      notes: input.notes || null,
      is_active: 1,
      created_at: now,
      updated_at: now,
    };

    this.driverRepo.create(driver);

    this.auditService.recordAction({
      userId: adminId,
      action: 'DRIVER_CREATED',
      entityType: 'DRIVER',
      entityId: driver.id,
      changes: { fullName: driver.full_name, mobile: driver.mobile_number, createdBy: adminName },
    });

    return driver;
  }

  updateDriver(id: string, updates: Partial<Driver>, adminId: string, adminName: string): Driver {
    const existing = this.driverRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Driver '${id}'`);
    }

    const updated = this.driverRepo.update(id, updates);
    if (!updated) {
      throw new NotFoundError(`Driver '${id}'`);
    }

    this.auditService.recordAction({
      userId: adminId,
      action: 'DRIVER_UPDATED',
      entityType: 'DRIVER',
      entityId: id,
      changes: { updates, updatedBy: adminName },
    });

    return updated;
  }

  getAllDrivers(activeOnly = false): Driver[] {
    return this.driverRepo.findAll({ activeOnly });
  }

  getDriverById(id: string): Driver | null {
    return this.driverRepo.findById(id);
  }
}
