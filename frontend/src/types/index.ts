export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  unit: string;
  min_quantity: number;
  typical_use_cases?: string | null;
  quality_specifications?: string | null;
  availability_disclaimer?: string | null;
  display_order: number;
}

export type OrderStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUOTATION_SENT'
  | 'CONFIRMED'
  | 'SUPPLIER_ASSIGNED'
  | 'TRUCK_ASSIGNED'
  | 'LOADING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'Refunded';
export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'REJECTED';
export type TruckAvailability = 'Available' | 'Busy' | 'Offline';
export type AvailabilityStatus = TruckAvailability;
export type QuotationStatus = 'DRAFT' | 'ISSUED' | 'ACCEPTED' | 'SUPERSEDED' | 'REJECTED';

export interface Customer {
  id: string;
  full_name: string;
  mobile_number: string;
  whatsapp_number?: string | null;
  delivery_address: string;
  area_pincode: string;
  map_pin_url?: string | null;
  internal_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_reference: string;
  customer_id: string;
  product_id: string;
  quantity: number;
  unit: string;
  delivery_address: string;
  area_pincode: string;
  preferred_delivery_date: string;
  additional_notes?: string | null;
  status: OrderStatus;
  cancellation_reason?: string | null;
  supplier_id?: string | null;
  truck_id?: string | null;
  driver_id?: string | null;
  current_quotation_id?: string | null;
  payment_status: PaymentStatus;
  qr_campaign_id?: string | null;
  created_at: string;
  updated_at: string;

  // Joined view fields
  customer_name?: string;
  customer_mobile?: string;
  product_name?: string;
  quoted_price?: number;
  quotation_version?: number;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  previous_status?: string | null;
  new_status: OrderStatus;
  changed_by_user_id?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Quotation {
  id: string;
  quotation_reference: string;
  order_id: string;
  version: number;
  quotation_status: QuotationStatus;
  material_cost: number;
  transport_cost: number;
  loading_cost: number;
  platform_fee: number;
  discount: number;
  final_delivered_price: number;
  estimated_gross_margin: number;
  validity_date: string;
  notes?: string | null;
  created_by_user_id: string;
  created_at: string;
}

export interface OrderNote {
  id: string;
  order_id: string;
  author_id?: string | null;
  author_name: string;
  note: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  business_name: string;
  contact_person: string;
  mobile_number: string;
  location_address: string;
  service_zones: string;
  supported_materials: string; // JSON array string
  verification_status: VerificationStatus;
  indicative_purchase_price?: number | null;
  price_updated_at?: string | null;
  quality_notes?: string | null;
  fulfillment_notes?: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  full_name: string;
  mobile_number: string;
  license_number?: string | null;
  verification_status: VerificationStatus;
  availability_status: TruckAvailability;
  notes?: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Truck {
  id: string;
  registration_number: string;
  capacity_tons: number;
  supported_materials: string; // JSON array string
  owner_name: string;
  owner_mobile: string;
  default_driver_id?: string | null;
  availability_status: TruckAvailability;
  indicative_transport_rate?: number | null;
  verification_status: VerificationStatus;
  notes?: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  default_driver_name?: string;
  default_driver_mobile?: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  payment_status: PaymentStatus;
  transaction_reference?: string | null;
  notes?: string | null;
  recorded_by_user_id: string;
  payment_date: string;
  created_at: string;
}

export interface DashboardSummary {
  totalOrders: number;
  newOrders: number;
  activeDeliveries: number;
  completedOrders: number;
  totalRevenue: number;
  totalDirectCosts: number;
  grossMargin: number;
  ordersByStatus: Record<string, number>;
  activeProductsCount: number;
  registeredSuppliersCount: number;
  registeredTrucksCount: number;
  registeredDriversCount: number;
  recentOrders: Order[];
}

export interface OrderDetailData {
  order: Order;
  customer: Customer | null;
  product: Product | null;
  activeQuotation: Quotation | null;
  quotations: Quotation[];
  supplier: Supplier | null;
  truck: Truck | null;
  driver: Driver | null;
  payments: Payment[];
  paymentSummary: {
    totalPaid: number;
    finalCustomerPrice: number;
    balanceDue: number;
    paymentStatus: PaymentStatus;
  };
  statusHistory: OrderStatusHistory[];
  notes: OrderNote[];
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  is_active: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}

export interface QuoteRequestFormData {
  material_id: string;
  quantity: number;
  unit: string;
  delivery_address: string;
  area_pincode: string;
  preferred_delivery_date: string;
  customer_name: string;
  mobile_number: string;
  whatsapp_number?: string;
  additional_notes?: string;
  map_pin_url?: string;
  qr_campaign_code?: string;
}
