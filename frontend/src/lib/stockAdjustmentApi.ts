import { api } from './api';
import type { PaginatedResponse } from '@/types';

export interface StockAdjustment {
  id: string;
  product_id: string;
  product_name?: string;
  model_no?: string;
  adjustment_type: string;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reason?: string;
  reference_id?: string;
  reference_type?: string;
  recorded_by?: string;
  created_at: string;
}

export const ADJUSTMENT_TYPES = [
  { value: 'restock',    label: 'Restock / Purchase',   dir: '+' },
  { value: 'return_in',  label: 'Customer Return (In)',  dir: '+' },
  { value: 'correction', label: 'Stock Correction (+)',  dir: '+' },
  { value: 'removal',    label: 'Stock Removal',         dir: '-' },
  { value: 'damage',     label: 'Damage / Write-off',   dir: '-' },
  { value: 'theft',      label: 'Loss / Theft',         dir: '-' },
  { value: 'return_out', label: 'Return to Supplier',   dir: '-' },
];

export const stockAdjustmentApi = {
  list: async (params: Record<string, string | number> = {}): Promise<PaginatedResponse<StockAdjustment>> => {
    const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
    const { data } = await api.get(`/stock-adjustments?${q}`);
    return data;
  },

  productHistory: async (productId: string): Promise<StockAdjustment[]> => {
    const { data } = await api.get(`/stock-adjustments/product/${productId}`);
    return data.data;
  },

  create: async (payload: {
    product_id: string;
    adjustment_type: string;
    quantity: number;
    reason?: string;
  }): Promise<StockAdjustment> => {
    const { data } = await api.post('/stock-adjustments', payload);
    return data.data;
  },
};
