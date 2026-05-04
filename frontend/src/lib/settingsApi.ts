import { api } from './api';

export type Settings = Record<string, string>;

export const settingsApi = {
  getAll: async (): Promise<Settings> => {
    const { data } = await api.get('/settings');
    return data.data;
  },

  update: async (updates: Settings): Promise<void> => {
    await api.put('/settings', updates);
  },
};
