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
  qr_campaign_id?: string | null;
  created_at: string;
  updated_at: string;
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
