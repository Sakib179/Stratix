import { api } from './api';
import type { Product, ProductCategory, PaginatedResponse } from '@/types';

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  category_id?: string | string[];
  min_price?: number;
  max_price?: number;
  stock?: 'in' | 'low' | 'out';
  tags?: string | string[];
}

export const productApi = {
  list: async (filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') {
        if (Array.isArray(v)) v.forEach((val) => params.append(k, val));
        else params.set(k, String(v));
      }
    });
    const { data } = await api.get(`/products?${params}`);
    return data;
  },

  get: async (id: string): Promise<Product> => {
    const { data } = await api.get(`/products/${id}`);
    return data.data;
  },

  create: async (formData: FormData): Promise<Product> => {
    const { data } = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  update: async (id: string, formData: FormData): Promise<Product> => {
    const { data } = await api.put(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  listCategories: async (): Promise<ProductCategory[]> => {
    const { data } = await api.get('/products/categories');
    return data.data;
  },

  createCategory: async (payload: { name: string; color_hex?: string }): Promise<ProductCategory> => {
    const { data } = await api.post('/products/categories', payload);
    return data.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/products/categories/${id}`);
  },

  bulkImport: async (file: File): Promise<{ imported: number; skipped: Array<{ row: number; reason: string }> }> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/products/bulk-import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  downloadTemplate: () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/products/csv-template`, '_blank');
  },
};
