import { apiClient } from './apiClient.js';
import {
  DashboardSummary,
  Order,
  OrderDetailData,
  OrderStatus,
  PaymentStatus,
  Supplier,
  Truck,
  Driver,
  Payment,
  Quotation,
  OrderNote,
} from '../types/index.js';

export interface OrderListParams {
  status?: string;
  payment_status?: string;
  category_id?: string;
  variant_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface ManualQuotationPayload {
  material_cost: number;
  transport_cost: number;
  loading_cost?: number;
  platform_fee?: number;
  discount?: number;
  validity_date: string;
  notes?: string;
  advance_order_status?: boolean;
}

export interface RecordPaymentPayload {
  amount: number;
  payment_method: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  payment_status?: PaymentStatus;
  transaction_reference?: string;
  notes?: string;
  payment_date?: string;
}

export const adminService = {
  // Dashboard Metrics
  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await apiClient.get<DashboardSummary>('/admin/dashboard/summary');
    return res.data!;
  },

  // Orders
  async getOrders(params: OrderListParams = {}): Promise<{ orders: Order[]; total: number }> {
    const res = await apiClient.get<Order[]>('/orders', { params });
    return {
      orders: res.data || [],
      total: res.meta?.total || 0,
    };
  },

  async getOrderDetail(id: string): Promise<OrderDetailData> {
    const res = await apiClient.get<OrderDetailData>(`/orders/${id}`);
    return res.data!;
  },

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    cancellation_reason?: string,
    notes?: string
  ): Promise<{ order: Order }> {
    const res = await apiClient.patch<{ order: Order }>(`/orders/${orderId}/status`, {
      status,
      cancellation_reason,
      notes,
    });
    return res.data!;
  },

  // Quotation Creation & Revision
  async createQuotation(orderId: string, payload: ManualQuotationPayload): Promise<{ quotation: Quotation; order: Order }> {
    const res = await apiClient.post<{ quotation: Quotation; order: Order }>(`/orders/${orderId}/quotations`, payload);
    return res.data!;
  },

  // Fulfillment Assignments
  async assignSupplier(orderId: string, supplierId: string): Promise<{ order: Order }> {
    const res = await apiClient.post<{ order: Order }>(`/orders/${orderId}/supplier`, { supplier_id: supplierId });
    return res.data!;
  },

  async assignTruck(orderId: string, truckId: string, autoAssignDefaultDriver = true): Promise<{ order: Order; warnings?: string[] }> {
    const res = await apiClient.post<{ order: Order; warnings?: string[] }>(`/orders/${orderId}/truck`, {
      truck_id: truckId,
      auto_assign_default_driver: autoAssignDefaultDriver,
    });
    return res.data!;
  },

  async assignDriver(orderId: string, driverId: string): Promise<{ order: Order; warnings?: string[] }> {
    const res = await apiClient.post<{ order: Order; warnings?: string[] }>(`/orders/${orderId}/driver`, {
      driver_id: driverId,
    });
    return res.data!;
  },

  // Payment Recording
  async recordPayment(orderId: string, payload: RecordPaymentPayload): Promise<{ payment: Payment; order: Order; totalPaid: number; balanceDue: number }> {
    const res = await apiClient.post<{ payment: Payment; order: Order; totalPaid: number; balanceDue: number }>(`/orders/${orderId}/payments`, payload);
    return res.data!;
  },

  // Operational Internal Notes
  async addOrderNote(orderId: string, note: string): Promise<{ note: OrderNote }> {
    const res = await apiClient.post<{ note: OrderNote }>(`/orders/${orderId}/notes`, { note });
    return res.data!;
  },

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const res = await apiClient.get<Supplier[]>('/admin/suppliers');
    return res.data || [];
  },

  async createSupplier(data: Omit<Partial<Supplier>, 'supported_materials'> & { supported_materials: string[] }): Promise<Supplier> {
    const res = await apiClient.post<Supplier>('/admin/suppliers', data);
    return res.data!;
  },

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
    const res = await apiClient.patch<Supplier>(`/admin/suppliers/${id}`, data);
    return res.data!;
  },

  // Trucks
  async getTrucks(): Promise<Truck[]> {
    const res = await apiClient.get<Truck[]>('/admin/trucks');
    return res.data || [];
  },

  async createTruck(data: Omit<Partial<Truck>, 'supported_materials'> & { supported_materials: string[] }): Promise<Truck> {
    const res = await apiClient.post<Truck>('/admin/trucks', data);
    return res.data!;
  },

  async updateTruck(id: string, data: Partial<Truck>): Promise<Truck> {
    const res = await apiClient.patch<Truck>(`/admin/trucks/${id}`, data);
    return res.data!;
  },

  // Drivers
  async getDrivers(): Promise<Driver[]> {
    const res = await apiClient.get<Driver[]>('/admin/drivers');
    return res.data || [];
  },

  async createDriver(data: Partial<Driver>): Promise<Driver> {
    const res = await apiClient.post<Driver>('/admin/drivers', data);
    return res.data!;
  },

  async updateDriver(id: string, data: Partial<Driver>): Promise<Driver> {
    const res = await apiClient.patch<Driver>(`/admin/drivers/${id}`, data);
    return res.data!;
  },

  // Payments Ledger
  async getPayments(limit = 50, offset = 0): Promise<{ payments: Payment[]; total: number }> {
    const res = await apiClient.get<Payment[]>('/admin/payments', { params: { limit, offset } });
    return {
      payments: res.data || [],
      total: res.meta?.total || 0,
    };
  },
};
