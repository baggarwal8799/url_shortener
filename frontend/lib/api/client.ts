import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import type { ApiError, ApiResponse } from '@/types';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage (only on client side)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Handle 401 Unauthorized - Clear token and redirect to login
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        // Only redirect if not already on login/register page
        if (!window.location.pathname.includes('/login') &&
            !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
      }
    }

    // Extract error message from response
    const errorMessage = error.response?.data?.msg ||
                        error.message ||
                        'An unexpected error occurred';

    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;

// Helper function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
};

// Helper function to extract data from API response
export const extractData = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (response.data.data) {
    return response.data.data;
  }
  throw new Error('Invalid API response format');
};
