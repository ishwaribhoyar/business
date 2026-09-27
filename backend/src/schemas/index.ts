import { z } from 'zod';

// Indian Mobile Number Validator (10 digits, optionally prefixed with +91 or 0)
export const indianMobileRegex = /^(?:(?:\+|0{0,2})91(\s*[-]\s*)?|[0]?)?[6789]\d{9}$/;

// Pincode Validator (Nagpur / Indian 6-digit postal code)
export const indianPincodeRegex = /^[1-9][0-9]{5}$/;

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const quoteRequestSchema = z.object({
  material_id: z.string().min(1, 'Material selection is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  delivery_address: z.string().min(5, 'Delivery address must be at least 5 characters').trim(),
  area_pincode: z.string().min(3, 'Area or Pincode is required').trim(),
  preferred_delivery_date: z.string().refine(
    (val) => {
      const parsed = Date.parse(val);
      if (isNaN(parsed)) return false;
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date.getTime() >= today.getTime();
    },
    {
      message: 'Preferred delivery date must be today or a future date',
    }
  ),
  customer_name: z.string().min(2, 'Customer name must be at least 2 characters').trim(),
  mobile_number: z.string().regex(indianMobileRegex, 'Please provide a valid 10-digit mobile number'),
  whatsapp_number: z.string().regex(indianMobileRegex, 'Please provide a valid WhatsApp number').optional().or(z.literal('')),
  additional_notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().or(z.literal('')),
  map_pin_url: z.string().url('Map pin must be a valid URL').optional().or(z.literal('')),
  qr_campaign_code: z.string().optional().or(z.literal('')),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    'NEW',
    'CONTACTED',
    'QUOTATION_SENT',
    'CONFIRMED',
    'SUPPLIER_ASSIGNED',
    'TRUCK_ASSIGNED',
    'LOADING',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
  ]),
  notes: z.string().max(500).optional().or(z.literal('')),
  cancellation_reason: z.string().max(500).optional().or(z.literal('')),
});

export const manualQuotationSchema = z.object({
  material_cost: z.number().min(0, 'Material cost cannot be negative'),
  transport_cost: z.number().min(0, 'Transport cost cannot be negative'),
  loading_cost: z.number().min(0, 'Loading cost cannot be negative').default(0),
  platform_fee: z.number().min(0, 'Platform margin/fee cannot be negative').default(0),
  discount: z.number().min(0, 'Discount cannot be negative').default(0),
  validity_date: z.string().min(1, 'Quotation validity date is required'),
  notes: z.string().max(500).optional().or(z.literal('')),
  advance_order_status: z.boolean().optional().default(true),
});

export const assignSupplierSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier ID is required'),
});

export const assignTruckSchema = z.object({
  truck_id: z.string().min(1, 'Truck ID is required'),
  auto_assign_default_driver: z.boolean().optional().default(true),
});

export const assignDriverSchema = z.object({
  driver_id: z.string().min(1, 'Driver ID is required'),
});

export const paymentCreateSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than zero'),
  payment_method: z.enum(['Cash', 'UPI', 'Bank Transfer', 'Cheque']),
  payment_status: z.enum(['Pending', 'Partially Paid', 'Paid', 'Refunded']).optional(),
  transaction_reference: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
  payment_date: z.string().optional(),
});

export const orderNoteCreateSchema = z.object({
  note: z.string().min(1, 'Note content cannot be empty').max(1000),
});

export const supplierCreateSchema = z.object({
  business_name: z.string().min(2, 'Business name is required').trim(),
  contact_person: z.string().min(2, 'Contact person name is required').trim(),
  mobile_number: z.string().regex(indianMobileRegex, 'Valid 10-digit mobile number is required'),
  location_address: z.string().min(5, 'Location address is required').trim(),
  service_zones: z.string().min(2, 'Service zones are required').trim().default('Nagpur and nearby areas'),
  supported_materials: z.array(z.string()).min(1, 'At least one supported material is required'),
  verification_status: z.enum(['VERIFIED', 'PENDING', 'REJECTED']).default('PENDING'),
  indicative_purchase_price: z.number().positive().optional(),
  quality_notes: z.string().max(1000).optional().or(z.literal('')),
  fulfillment_notes: z.string().max(1000).optional().or(z.literal('')),
});

export const supplierUpdateSchema = supplierCreateSchema.partial().extend({
  is_active: z.number().int().min(0).max(1).optional(),
});

export const driverCreateSchema = z.object({
  full_name: z.string().min(2, 'Driver name is required').trim(),
  mobile_number: z.string().regex(indianMobileRegex, 'Valid 10-digit driver mobile is required'),
  license_number: z.string().max(50).optional().or(z.literal('')),
  verification_status: z.enum(['VERIFIED', 'PENDING', 'REJECTED']).default('PENDING'),
  availability_status: z.enum(['Available', 'Busy', 'Offline']).default('Available'),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export const driverUpdateSchema = driverCreateSchema.partial().extend({
  is_active: z.number().int().min(0).max(1).optional(),
});

export const truckCreateSchema = z.object({
  registration_number: z.string().min(4, 'Valid vehicle registration number is required').trim(),
  capacity_tons: z.number().positive('Capacity in tons must be positive'),
  supported_materials: z.array(z.string()).min(1, 'At least one supported material is required'),
  owner_name: z.string().min(2, 'Owner name is required').trim(),
  owner_mobile: z.string().regex(indianMobileRegex, 'Valid 10-digit owner mobile is required'),
  default_driver_id: z.string().optional().or(z.literal('')),
  verification_status: z.enum(['VERIFIED', 'PENDING', 'REJECTED']).default('PENDING'),
  availability_status: z.enum(['Available', 'Busy', 'Offline']).default('Available'),
  indicative_transport_rate: z.number().positive().optional(),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export const truckUpdateSchema = truckCreateSchema.partial().extend({
  is_active: z.number().int().min(0).max(1).optional(),
});
