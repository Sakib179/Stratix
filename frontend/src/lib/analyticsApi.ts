import { api } from './api';

export interface PeriodParams { period?: number; }

export const analyticsApi = {
  overview: async (params: PeriodParams = {}) => {
    const { data } = await api.get('/analytics/overview', { params });
    return data.data as {
      revenue_period:     number;
      revenue_change_pct: number;
      total_invoices:     number;
      invoice_change_pct: number;
      total_clients:      number;
      new_clients_period: number;
      client_change_pct:  number;
      total_products:     number;
      pending_invoices:   number;
      overdue_invoices:   number;
      status_breakdown:   Record<string, number>;
    };
  },

  revenueChart: async (params: { period?: number; group_by?: 'day' | 'week' | 'month' } = {}) => {
    const { data } = await api.get('/analytics/revenue', { params });
    return data.data as { period: string; revenue: number; invoice_count: number }[];
  },

  topProducts: async (params: PeriodParams & { limit?: number } = {}) => {
    const { data } = await api.get('/analytics/top-products', { params });
    return data.data as { product_name: string; model_no: string; units_sold: number; revenue: number }[];
  },

  topClients: async (params: PeriodParams & { limit?: number } = {}) => {
    const { data } = await api.get('/analytics/top-clients', { params });
    return data.data as { id: string; full_name: string; phone: string; email: string; invoice_count: number; total_spent: number }[];
  },

  invoiceAging: async () => {
    const { data } = await api.get('/analytics/invoice-aging');
    return data.data as { bucket: string; count: number; amount: number }[];
  },

  stockSummary: async () => {
    const { data } = await api.get('/analytics/stock');
    return data.data as {
      in_stock: number; low_stock: number; out_of_stock: number;
      inventory_value: number;
      critical_items: { product_name: string; model_no: string; stock_quantity: number; stock_threshold: number; unit_price: number }[];
    };
  },
};
