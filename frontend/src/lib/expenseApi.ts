import { api } from './api';
import type { PaginatedResponse } from '@/types';

export interface ExpenseCategory {
  id: string;
  name: string;
  color_hex: string;
  created_at: string;
}

export interface Expense {
  id: string;
  category_id?: string;
  category_name?: string;
  color_hex?: string;
  title: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  expense_date: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  date_from?: string;
  date_to?: string;
}

export const expenseApi = {
  categories: async (): Promise<ExpenseCategory[]> => {
    const { data } = await api.get('/expenses/categories');
    return data.data;
  },

  createCategory: async (payload: { name: string; color_hex?: string }): Promise<ExpenseCategory> => {
    const { data } = await api.post('/expenses/categories', payload);
    return data.data;
  },

  list: async (filters: ExpenseFilters = {}): Promise<PaginatedResponse<Expense> & { total_amount?: number }> => {
    const q = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]));
    const { data } = await api.get(`/expenses?${q}`);
    return data;
  },

  get: async (id: string): Promise<Expense> => {
    const { data } = await api.get(`/expenses/${id}`);
    return data.data;
  },

  create: async (payload: Partial<Expense>): Promise<Expense> => {
    const { data } = await api.post('/expenses', payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<Expense>): Promise<void> => {
    await api.put(`/expenses/${id}`, payload);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },

  exportCsv: async (filters: Record<string, string> = {}): Promise<void> => {
    const q = new URLSearchParams(filters);
    const { data } = await api.get(`/expenses/export?${q}`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([data], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
