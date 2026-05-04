import { api } from './api';
import type { Client, PaginatedResponse } from '@/types';

export interface ClientFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export const clientApi = {
  list: async (filters: ClientFilters = {}): Promise<PaginatedResponse<Client>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v));
    });
    const { data } = await api.get(`/clients?${params}`);
    return data;
  },

  search: async (query: { phone?: string; name?: string }): Promise<Client[]> => {
    const params = new URLSearchParams();
    if (query.phone) params.set('phone', query.phone);
    if (query.name) params.set('name', query.name);
    const { data } = await api.get(`/clients/search?${params}`);
    return data.data;
  },

  get: async (id: string): Promise<Client & { invoices: any[]; stats: { invoice_count: number; total_spent: number; outstanding: number } }> => {
    const { data } = await api.get(`/clients/${id}`);
    return data.data;
  },

  create: async (payload: {
    full_name: string;
    phone: string;
    email?: string;
    address?: string;
    notes?: string;
  }): Promise<Client> => {
    const { data } = await api.post('/clients', payload);
    return data.data;
  },

  update: async (id: string, payload: {
    full_name?: string;
    email?: string;
    address?: string;
    notes?: string;
    email_unsubscribed?: boolean;
  }): Promise<Client> => {
    const { data } = await api.put(`/clients/${id}`, payload);
    return data.data;
  },
};
