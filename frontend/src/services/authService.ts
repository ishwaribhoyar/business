import { apiClient } from './apiClient.js';
import { AdminUser } from '../types/index.js';

export interface LoginResponseData {
  token: string;
  user: AdminUser;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponseData> {
    const res = await apiClient.post<LoginResponseData>('/auth/login', { email, password });
    if (res.data?.token) {
      localStorage.setItem('nbm_admin_token', res.data.token);
      localStorage.setItem('nbm_admin_user', JSON.stringify(res.data.user));
    }
    return res.data!;
  },

  logout(): void {
    localStorage.removeItem('nbm_admin_token');
    localStorage.removeItem('nbm_admin_user');
  },

  getCurrentUser(): AdminUser | null {
    const userStr = localStorage.getItem('nbm_admin_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('nbm_admin_token');
  },
};
