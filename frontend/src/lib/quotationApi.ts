import { api } from './api';
import type { PaginatedResponse } from '@/types';

export interface QuotationItem {
  id?: string;
  product_id?: string;
  product_name_snapshot: string;
  model_no_snapshot?: string;
  unit_price_snapshot: number;
  quantity: number;
  discount_type?: 'flat' | 'percent';
  discount?: number;
  line_total?: number;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  client_id: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  client_address?: string;
  items?: QuotationItem[];
  subtotal: number;
  discount_type: 'flat' | 'percent';
  discount_value: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  grand_total: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Converted';
  valid_until?: string;
  notes?: string;
  converted_invoice_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const quotationApi = {
  list: async (params: Record<string, string | number> = {}): Promise<PaginatedResponse<Quotation>> => {
    const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
    const { data } = await api.get(`/quotations?${q}`);
    return data;
  },

  get: async (id: string): Promise<Quotation> => {
    const { data } = await api.get(`/quotations/${id}`);
    return data.data;
  },

  create: async (payload: Partial<Quotation> & { items: QuotationItem[] }): Promise<Quotation> => {
    const { data } = await api.post('/quotations', payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<Quotation> & { items?: QuotationItem[] }): Promise<void> => {
    await api.put(`/quotations/${id}`, payload);
  },

  updateStatus: async (id: string, status: string): Promise<void> => {
    await api.put(`/quotations/${id}`, { status });
  },

  convertToInvoice: async (id: string, due_date?: string): Promise<{ invoice_id: string; invoice_number: string }> => {
    const { data } = await api.post(`/quotations/${id}/convert`, { due_date });
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/quotations/${id}`);
  },
};
