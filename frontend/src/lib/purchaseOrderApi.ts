import { api } from './api';
import type { PaginatedResponse } from '@/types';

export interface POItem {
  id?: string;
  product_id: string;
  product_name?: string;
  model_no?: string;
  quantity_ordered: number;
  quantity_received?: number;
  unit_cost: number;
  line_total?: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id?: string;
  supplier_name?: string;
  supplier_phone?: string;
  status: 'Draft' | 'Ordered' | 'Received' | 'Cancelled';
  expected_date?: string;
  received_date?: string;
  notes?: string;
  total_amount: number;
  items?: POItem[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const purchaseOrderApi = {
  list: async (params: Record<string, string | number> = {}): Promise<PaginatedResponse<PurchaseOrder>> => {
    const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
    const { data } = await api.get(`/purchase-orders?${q}`);
    return data;
  },

  get: async (id: string): Promise<PurchaseOrder> => {
    const { data } = await api.get(`/purchase-orders/${id}`);
    return data.data;
  },

  create: async (payload: { supplier_id?: string; items: POItem[]; expected_date?: string; notes?: string }): Promise<PurchaseOrder> => {
    const { data } = await api.post('/purchase-orders', payload);
    return data.data;
  },

  updateStatus: async (id: string, status: string, received_date?: string): Promise<void> => {
    await api.patch(`/purchase-orders/${id}/status`, { status, received_date });
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/purchase-orders/${id}`);
  },
};
