import { apiClient } from './apiClient.js';
import { Order, QuoteRequestFormData } from '../types/index.js';

export interface QuoteRequestResponse {
  orderId: string;
  orderReference: string;
  status: string;
  message: string;
  whatsappDirectUrl: string;
}

export const orderService = {
  async submitQuoteRequest(data: QuoteRequestFormData): Promise<QuoteRequestResponse> {
    const res = await apiClient.post<QuoteRequestResponse>('/orders/quote-request', data);
    return res.data!;
  },

  async getOrders(status?: string): Promise<{ orders: Order[]; total: number }> {
    const endpoint = status ? `/orders?status=${status}` : '/orders';
    const res = await apiClient.get<Order[]>(endpoint);
    return {
      orders: res.data || [],
      total: res.meta?.total || (res.data ? res.data.length : 0),
    };
  },

  async getOrderDetail(id: string): Promise<any> {
    const res = await apiClient.get<any>(`/orders/${id}`);
    return res.data;
  },
};
