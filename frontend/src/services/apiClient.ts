import { ApiResponse } from '../types/index.js';
import { APP_CONFIG } from '../config/index.js';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = APP_CONFIG.apiBaseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem('nbm_admin_token');
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok || !data.success) {
        let errorMsg = data.error?.message || `Request failed with status ${response.status}`;
        if (data.error?.details && Array.isArray(data.error.details) && data.error.details.length > 0) {
          const detailMsgs = data.error.details.map((d: any) => d.message || `${d.field}: invalid`);
          errorMsg = detailMsgs.join('. ');
        }
        const err = new Error(errorMsg);
        (err as any).details = data.error?.details;
        throw err;
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown network error occurred');
    }
  }

  get<T>(endpoint: string, options?: { params?: Record<string, any> } | Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    const rawParams = options && 'params' in options ? options.params : options;
    if (rawParams && typeof rawParams === 'object') {
      const searchParams = new URLSearchParams();
      for (const [key, val] of Object.entries(rawParams)) {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }
}

export const apiClient = new ApiClient();
