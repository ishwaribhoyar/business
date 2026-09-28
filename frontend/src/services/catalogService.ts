import { apiClient } from './apiClient.js';
import { ProductCategory, ProductVariant } from '../types/index.js';

export const catalogService = {
  // -------------------------------------------------------------
  // Public Customer Catalog
  // -------------------------------------------------------------
  async getCategories(includeVariants = false): Promise<ProductCategory[]> {
    const res = await apiClient.get<ProductCategory[]>(
      `/catalog/categories${includeVariants ? '?include_variants=true' : ''}`
    );
    return res.data || [];
  },

  async getCategoryBySlug(slug: string): Promise<ProductCategory> {
    const res = await apiClient.get<ProductCategory>(`/catalog/categories/${slug}`);
    return res.data!;
  },

  async getVariantsForCategory(categorySlug: string): Promise<ProductVariant[]> {
    const res = await apiClient.get<ProductVariant[]>(
      `/catalog/categories/${categorySlug}/variants`
    );
    return res.data || [];
  },

  async getVariantBySlug(categorySlug: string, variantSlug: string): Promise<ProductVariant> {
    const res = await apiClient.get<ProductVariant>(
      `/catalog/categories/${categorySlug}/variants/${variantSlug}`
    );
    return res.data!;
  },

  async getVariantById(id: string): Promise<ProductVariant> {
    const res = await apiClient.get<ProductVariant>(`/catalog/variants/${id}`);
    return res.data!;
  },

  // -------------------------------------------------------------
  // Admin Operations
  // -------------------------------------------------------------
  async getAdminCategories(): Promise<ProductCategory[]> {
    const res = await apiClient.get<ProductCategory[]>('/admin/catalog/categories');
    return res.data || [];
  },

  async createCategory(payload: Partial<ProductCategory>): Promise<ProductCategory> {
    const res = await apiClient.post<ProductCategory>('/admin/catalog/categories', payload);
    return res.data!;
  },

  async updateCategory(id: string, payload: Partial<ProductCategory>): Promise<ProductCategory> {
    const res = await apiClient.patch<ProductCategory>(`/admin/catalog/categories/${id}`, payload);
    return res.data!;
  },

  async getAdminVariants(): Promise<ProductVariant[]> {
    const res = await apiClient.get<ProductVariant[]>('/admin/catalog/variants');
    return res.data || [];
  },

  async createVariant(payload: Partial<ProductVariant>): Promise<ProductVariant> {
    const res = await apiClient.post<ProductVariant>('/admin/catalog/variants', payload);
    return res.data!;
  },

  async updateVariant(id: string, payload: Partial<ProductVariant>): Promise<ProductVariant> {
    const res = await apiClient.patch<ProductVariant>(`/admin/catalog/variants/${id}`, payload);
    return res.data!;
  },
};
