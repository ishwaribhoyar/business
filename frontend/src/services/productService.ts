import { apiClient } from './apiClient.js';
import { Product } from '../types/index.js';

export const productService = {
  async getProducts(): Promise<Product[]> {
    const res = await apiClient.get<Product[]>('/products');
    return res.data || [];
  },

  async getProductBySlug(slug: string): Promise<Product> {
    const res = await apiClient.get<Product>(`/products/${slug}`);
    return res.data!;
  },
};
