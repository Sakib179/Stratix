import { api } from './api';

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  paid_at: string;
  recorded_by: string;
  recorded_by_name?: string;
  created_at: string;
}

export interface CreatePaymentPayload {
  amount: number;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  paid_at?: string;
}

export const paymentApi = {
  listByInvoice: async (invoiceId: string): Promise<Payment[]> => {
    const { data } = await api.get(`/invoices/${invoiceId}/payments`);
    return data.data;
  },

  create: async (invoiceId: string, payload: CreatePaymentPayload): Promise<Payment> => {
    const { data } = await api.post(`/invoices/${invoiceId}/payments`, payload);
    return data.data;
  },

  remove: async (invoiceId: string, paymentId: string): Promise<void> => {
    await api.delete(`/invoices/${invoiceId}/payments/${paymentId}`);
  },
};
