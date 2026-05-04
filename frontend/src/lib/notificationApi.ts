import { api } from './api';
import type { Notification } from '@/types';

export const notificationApi = {
  list: async (): Promise<Notification[]> => {
    const { data } = await api.get('/notifications');
    return data.data;
  },

  markRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.patch('/notifications/mark-all-read');
  },
};
