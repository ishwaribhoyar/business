import { SupplierRepository } from '../repositories/supplierRepository.js';
import { AuditService } from '../services/auditService.js';
import { Supplier, VerificationStatus } from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export interface CreateSupplierInput {
  business_name: string;
  contact_person: string;
  mobile_number: string;
  location_address: string;
  service_zones?: string;
  supported_materials: string[];
  verification_status?: VerificationStatus;
  indicative_purchase_price?: number;
  quality_notes?: string;
  fulfillment_notes?: string;
}

export class SupplierService {
  private supplierRepo: SupplierRepository;
  private auditService: AuditService;

  constructor(supplierRepo = new SupplierRepository(), auditService = new AuditService()) {
    this.supplierRepo = supplierRepo;
    this.auditService = auditService;
  }

  async createSupplier(input: CreateSupplierInput, adminId: string, adminName: string): Promise<Supplier> {
    if (!input.business_name || input.business_name.trim().length < 2) {
      throw new ValidationError('Supplier business name must be at least 2 characters.');
    }
    if (!input.mobile_number || !/^[6-9]\d{9}$/.test(input.mobile_number.replace(/\D/g, '').slice(-10))) {
      throw new ValidationError('A valid 10-digit Indian mobile number is required.');
    }
    if (!input.location_address || input.location_address.trim().length < 3) {
      throw new ValidationError('Location address must be provided.');
    }

    const now = new Date().toISOString();
    const id = `sup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const supplier: Supplier = {
      id,
      business_name: input.business_name.trim(),
      contact_person: input.contact_person ? input.contact_person.trim() : input.business_name.trim(),
      mobile_number: input.mobile_number.replace(/\D/g, '').slice(-10),
      location_address: input.location_address.trim(),
      service_zones: input.service_zones || 'Nagpur and nearby areas',
      supported_materials: JSON.stringify(input.supported_materials || []),
      verification_status: input.verification_status || 'PENDING',
      indicative_purchase_price: input.indicative_purchase_price ? Number(input.indicative_purchase_price) : null,
      price_updated_at: input.indicative_purchase_price ? now : null,
      quality_notes: input.quality_notes || null,
      fulfillment_notes: input.fulfillment_notes || null,
      is_active: 1,
      created_at: now,
      updated_at: now,
    };

    await this.supplierRepo.create(supplier);

    await this.auditService.recordAction({
      userId: adminId,
      action: 'SUPPLIER_CREATED',
      entityType: 'SUPPLIER',
      entityId: supplier.id,
      changes: { businessName: supplier.business_name, createdBy: adminName },
    });

    return supplier;
  }

  async updateSupplier(id: string, updates: Partial<Supplier>, adminId: string, adminName: string): Promise<Supplier> {
    const existing = await this.supplierRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Supplier '${id}'`);
    }

    // If indicative purchase price changed, update price_updated_at timestamp
    if (updates.indicative_purchase_price !== undefined && updates.indicative_purchase_price !== existing.indicative_purchase_price) {
      updates.price_updated_at = new Date().toISOString();
    }

    const updated = await this.supplierRepo.update(id, updates);
    if (!updated) {
      throw new NotFoundError(`Supplier '${id}'`);
    }

    await this.auditService.recordAction({
      userId: adminId,
      action: 'SUPPLIER_UPDATED',
      entityType: 'SUPPLIER',
      entityId: id,
      changes: { updates, updatedBy: adminName },
    });

    return updated;
  }

  async getAllSuppliers(activeOnly = false): Promise<Supplier[]> {
    return (await this.supplierRepo.findAll({ activeOnly })) as Supplier[];
  }

  async getSupplierById(id: string): Promise<Supplier | null> {
    return (await this.supplierRepo.findById(id)) as Supplier | null;
  }
}
