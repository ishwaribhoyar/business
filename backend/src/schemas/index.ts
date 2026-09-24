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
  preferred_delivery_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Preferred delivery date must be a valid date',
  }),
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
  notes: z.string().max(500).optional(),
  cancellation_reason: z.string().max(500).optional(),
});

export const quotationCreateSchema = z.object({
  order_id: z.string().min(1, 'Order ID is required'),
  material_cost: z.number().min(0, 'Material cost cannot be negative'),
  transport_cost: z.number().min(0, 'Transport cost cannot be negative'),
  loading_cost: z.number().min(0).default(0),
  platform_fee: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  final_delivered_price: z.number().positive('Final delivered price must be positive'),
  estimated_gross_margin: z.number(),
  validity_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Quotation validity date must be a valid date',
  }),
  notes: z.string().max(500).optional(),
});

export const supplierCreateSchema = z.object({
  business_name: z.string().min(2, 'Business name is required').trim(),
  contact_person: z.string().min(2, 'Contact person name is required').trim(),
  mobile_number: z.string().regex(indianMobileRegex, 'Valid 10-digit mobile number is required'),
  location_address: z.string().min(5, 'Location address is required').trim(),
  service_zones: z.string().min(2, 'Service zones are required').trim(),
  supported_materials: z.array(z.string()).min(1, 'At least one supported material is required'),
  indicative_purchase_price: z.number().positive().optional(),
  quality_notes: z.string().max(1000).optional(),
  fulfillment_notes: z.string().max(1000).optional(),
});

export const truckCreateSchema = z.object({
  registration_number: z.string().min(4, 'Valid vehicle registration number is required').trim(),
  capacity_tons: z.number().positive('Capacity in tons must be positive'),
  supported_materials: z.array(z.string()).min(1, 'At least one supported material is required'),
  owner_name: z.string().min(2, 'Owner name is required').trim(),
  owner_mobile: z.string().regex(indianMobileRegex, 'Valid 10-digit owner mobile is required'),
  driver_name: z.string().min(2, 'Driver name is required').trim(),
  driver_mobile: z.string().regex(indianMobileRegex, 'Valid 10-digit driver mobile is required'),
  availability_status: z.enum(['Available', 'Busy', 'Offline']).default('Available'),
  indicative_transport_rate: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
});
