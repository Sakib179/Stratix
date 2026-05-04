import { api } from './api';
import type { PaginatedResponse } from '@/types';

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  po_count?: number;
  recent_orders?: { id: string; po_number: string; status: string; total_amount: number; created_at: string }[];
  created_at: string;
  updated_at: string;
}

export const supplierApi = {
  list: async (params: Record<string, string | number> = {}): Promise<PaginatedResponse<Supplier>> => {
    const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
    const { data } = await api.get(`/suppliers?${q}`);
    return data;
  },

  get: async (id: string): Promise<Supplier> => {
    const { data } = await api.get(`/suppliers/${id}`);
    return data.data;
  },

  create: async (payload: Partial<Supplier>): Promise<Supplier> => {
    const { data } = await api.post('/suppliers', payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<Supplier>): Promise<void> => {
    await api.put(`/suppliers/${id}`, payload);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },

  search: async (q: string): Promise<Supplier[]> => {
    const { data } = await api.get(`/suppliers?search=${encodeURIComponent(q)}&limit=20`);
    return data.data ?? [];
  },
};
