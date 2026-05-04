import { api } from './api';
import type { Invoice, InvoiceItem, PaginatedResponse } from '@/types';

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  client_id?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface CreateInvoicePayload {
  client_id: string;
  due_date: string;
  discount_type?: 'flat' | 'percent';
  discount_value?: number;
  tax_rate?: number;
  notes?: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price_override?: number;
    discount_type?: 'flat' | 'percent';
    discount?: number;
  }[];
}

export const invoiceApi = {
  list: async (filters: InvoiceFilters = {}): Promise<PaginatedResponse<Invoice>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v));
    });
    const { data } = await api.get(`/invoices?${params}`);
    return data;
  },

  get: async (id: string): Promise<Invoice & { items: InvoiceItem[]; status_history: any[] }> => {
    const { data } = await api.get(`/invoices/${id}`);
    return data.data;
  },

  create: async (payload: CreateInvoicePayload): Promise<Invoice> => {
    const { data } = await api.post('/invoices', payload);
    return data.data;
  },

  updateStatus: async (id: string, status: string, notes?: string): Promise<Invoice> => {
    const { data } = await api.patch(`/invoices/${id}/status`, { status, notes });
    return data.data;
  },

  duplicate: async (id: string): Promise<Invoice> => {
    const { data } = await api.post(`/invoices/${id}/duplicate`);
    return data.data;
  },

  downloadPDF: async (id: string, invoiceNumber: string): Promise<void> => {
    const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },

  sendEmail: async (id: string): Promise<void> => {
    await api.post(`/invoices/${id}/send-email`);
  },
};
