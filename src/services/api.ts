import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

import { toast } from '@/hooks/use-toast';

// API configuration
// export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333/api';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://sacore-ai-api-twhc.onrender.com/api';
// export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://devsacoreapi.56-north.com/api';

const API_TIMEOUT = 30000; // 30 seconds

// Types for API responses
export interface ApiResponse<T = any> {
  data?: T;
  accessToken?: string;
  refreshToken?: string;
  user?: any;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// Create axios instance with default configs
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });

  failedQueue = [];
};

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { response, config } = error;

    if (response?.status === 401 && config && !(config as any)._retry) {
      if (config.url?.includes('/auth/refresh-token') || config.url?.includes('/auth/login')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      (config as any)._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const { default: authService } = await import('./authService');
          const { accessToken } = await authService.refreshToken();

          processQueue(null, accessToken);

          if (config.headers) {
            (config.headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
          }

          return apiClient(config);
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (config.headers) {
                (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
              }
              resolve(apiClient(config));
            },
            reject: (err: any) => reject(err),
          });
        });
      }
    }

    return Promise.reject(error);
  }
);
// Add this utility function before the export statement
export const showApiResponseToast = (message: string, title?: string) => {
  if (!message) return;

  // Check if message contains success indicators
  if (message.toLowerCase().includes('successfully') || message.toLowerCase().includes('success')) {
    toast({
      title: title || 'Success',
      description: message,
      variant: 'success',
    });
  }
  // Check if message contains error indicators
  else if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') || message.toLowerCase().includes('invalid')) {
    toast({
      title: title || 'Error',
      description: message,
      variant: 'destructive',
    });
  }
  // Default toast
  else {
    toast({
      title: title || 'Notification',
      description: message,
    });
  }
};

// Helper to process API errors
export const handleApiError = (error: any): ErrorResponse => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;

    const data = axiosError.response?.data;
    const errorMessage = data?.message || data?.details || data?.error || 'An unexpected error occurred';

    // Show error toast
    showApiResponseToast(errorMessage, 'Error');

    return {
      message: errorMessage,
      errors: data?.errors,
      status: axiosError.response?.status
    };
  }

  const errorMessage = error.message || 'An unexpected error occurred';
  showApiResponseToast(errorMessage, 'Error');

  return {
    message: errorMessage,
  };
};

// API methods
export const api = {
  /**
   * GET request
   */
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response: AxiosResponse<T> = await apiClient.get(url, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * POST request
   */
  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response: AxiosResponse<T> = await apiClient.post(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * PUT request
   */
  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response: AxiosResponse<T> = await apiClient.put(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * PATCH request
   */
  patch: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response: AxiosResponse<T> = await apiClient.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * DELETE request
   */
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response: AxiosResponse<T> = await apiClient.delete(url, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// LinkedIn API functions
export const linkedinApi = {
  /**
   * Save LinkedIn user profile
   */
  saveUserProfile: async (linkedinUrl: string): Promise<ApiResponse> => {
    return api.post('/linkedin/save-user-profile', { linkedinUrl });
  },

  /**
   * Get LinkedIn session information
   */
  getSession: async (): Promise<ApiResponse> => {
    return api.get('/linkedin/session');
  },

  /**
   * Get LinkedIn extension status
   */
  getExtensionStatus: async (): Promise<ApiResponse> => {
    return api.get('/linkedin/extension-status');
  },
};

export default api;
