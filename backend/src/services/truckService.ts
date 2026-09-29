import { TruckRepository, TruckWithDriver } from '../repositories/truckRepository.js';
import { DriverRepository } from '../repositories/driverRepository.js';
import { AuditService } from '../services/auditService.js';
import { Truck, TruckAvailability, VerificationStatus } from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export interface CreateTruckInput {
  registration_number: string;
  capacity_tons: number;
  supported_materials: string[];
  owner_name: string;
  owner_mobile: string;
  default_driver_id?: string | null;
  availability_status?: TruckAvailability;
  indicative_transport_rate?: number;
  verification_status?: VerificationStatus;
  notes?: string;
}

export class TruckService {
  private truckRepo: TruckRepository;
  private driverRepo: DriverRepository;
  private auditService: AuditService;

  constructor(
    truckRepo = new TruckRepository(),
    driverRepo = new DriverRepository(),
    auditService = new AuditService()
  ) {
    this.truckRepo = truckRepo;
    this.driverRepo = driverRepo;
    this.auditService = auditService;
  }

  async createTruck(input: CreateTruckInput, adminId: string, adminName: string): Promise<Truck> {
    if (!input.registration_number || input.registration_number.trim().length < 4) {
      throw new ValidationError('A valid truck registration number is required (e.g. MH-31-AP-1234).');
    }
    if (!input.capacity_tons || Number(input.capacity_tons) <= 0) {
      throw new ValidationError('Truck capacity (in tons) must be greater than 0.');
    }
    if (!input.owner_name || input.owner_name.trim().length < 2) {
      throw new ValidationError('Owner name must be at least 2 characters.');
    }
    if (!input.owner_mobile || !/^[6-9]\d{9}$/.test(input.owner_mobile.replace(/\D/g, '').slice(-10))) {
      throw new ValidationError('A valid 10-digit Indian owner mobile number is required.');
    }

    if (input.default_driver_id) {
      const driver = await this.driverRepo.findById(input.default_driver_id);
      if (!driver) {
        throw new NotFoundError(`Default driver '${input.default_driver_id}'`);
      }
    }

    const now = new Date().toISOString();
    const id = `trk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const truck: Truck = {
      id,
      registration_number: input.registration_number.trim().toUpperCase(),
      capacity_tons: Number(input.capacity_tons),
      supported_materials: JSON.stringify(input.supported_materials || []),
      owner_name: input.owner_name.trim(),
      owner_mobile: input.owner_mobile.replace(/\D/g, '').slice(-10),
      default_driver_id: input.default_driver_id || null,
      availability_status: input.availability_status || 'Available',
      indicative_transport_rate: input.indicative_transport_rate ? Number(input.indicative_transport_rate) : null,
      verification_status: input.verification_status || 'PENDING',
      notes: input.notes || null,
      is_active: 1,
      created_at: now,
      updated_at: now,
    };

    await this.truckRepo.create(truck);

    await this.auditService.recordAction({
      userId: adminId,
      action: 'TRUCK_CREATED',
      entityType: 'TRUCK',
      entityId: truck.id,
      changes: { registrationNumber: truck.registration_number, createdBy: adminName },
    });

    return truck;
  }

  async updateTruck(id: string, updates: Partial<Truck>, adminId: string, adminName: string): Promise<Truck> {
    const existing = await this.truckRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Truck '${id}'`);
    }

    const updated = await this.truckRepo.update(id, updates);
    if (!updated) {
      throw new NotFoundError(`Truck '${id}'`);
    }

    await this.auditService.recordAction({
      userId: adminId,
      action: 'TRUCK_UPDATED',
      entityType: 'TRUCK',
      entityId: id,
      changes: { updates, updatedBy: adminName },
    });

    return updated;
  }

  async getAllTrucks(activeOnly = false): Promise<TruckWithDriver[]> {
    return (await this.truckRepo.findAll({ activeOnly })) as TruckWithDriver[];
  }

  async getTruckById(id: string): Promise<Truck | null> {
    return (await this.truckRepo.findById(id)) as Truck | null;
  }
}
