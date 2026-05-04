import { api } from './api';
import type { User, Permission, PaginatedResponse, AuditLog } from '@/types';

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  is_active?: boolean | string;
}

export interface CreateUserPayload {
  full_name: string;
  email: string;
  phone?: string;
  role?: 'admin' | 'employee';
  designation?: string;
  department?: string;
  permissions?: Permission[];
}

export const adminApi = {
  stats: async () => {
    const { data } = await api.get('/admin/stats');
    return data.data as {
      active_users: number;
      total_products: number;
      total_clients: number;
      invoice_breakdown: Record<string, number>;
      total_revenue: number;
      low_stock_count: number;
    };
  },

  listUsers: async (filters: UserFilters = {}): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v));
    });
    const { data } = await api.get(`/admin/users?${params}`);
    return data;
  },

  getUser: async (id: string) => {
    const { data } = await api.get(`/admin/users/${id}`);
    return data.data as User & { permissions: Permission[]; recentActivity: AuditLog[] };
  },

  createUser: async (payload: CreateUserPayload): Promise<User> => {
    const { data } = await api.post('/admin/users', payload);
    return data.data;
  },

  updateUser: async (id: string, payload: Partial<{
    full_name: string;
    phone: string;
    role: string;
    designation: string;
    department: string;
    is_active: boolean;
  }>): Promise<User> => {
    const { data } = await api.put(`/admin/users/${id}`, payload);
    return data.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  resetPassword: async (id: string): Promise<void> => {
    await api.post(`/admin/users/${id}/reset-password`);
  },

  updatePermissions: async (id: string, permissions: Permission[]): Promise<Permission[]> => {
    const { data } = await api.put(`/admin/users/${id}/permissions`, { permissions });
    return data.data;
  },

  auditLogs: async (filters: Record<string, string> = {}): Promise<PaginatedResponse<AuditLog>> => {
    const params = new URLSearchParams(filters);
    const { data } = await api.get(`/admin/audit-logs?${params}`);
    return data;
  },
};
