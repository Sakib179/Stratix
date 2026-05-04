import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.data.accessToken;
        setAccessToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

let _accessToken: string | null = null;

export const getAccessToken = () => _accessToken;
export const setAccessToken = (token: string | null) => { _accessToken = token; };

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  verifyTwoFactor: (tempToken: string, code: string, isBackupCode = false) =>
    api.post('/auth/verify-2fa', { tempToken, code, isBackupCode }),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  me: (token: string) => api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: Record<string, unknown>) => api.patch('/users/profile', data),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/users/change-password', data),
  getActivityLog: (page = 1) => api.get(`/users/activity-log?page=${page}`),
  getAttachments: () => api.get('/users/attachments'),
  uploadAttachment: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/users/attachments', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteAttachment: (id: string) => api.delete(`/users/attachments/${id}`),
  setup2FA: () => api.post('/users/2fa/setup'),
  verify2FASetup: (code: string) => api.post('/users/2fa/verify-setup', { code }),
  disable2FA: (password: string) => api.post('/users/2fa/disable', { password }),
};

export default api;
