import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 30000;

// Global error handler
let globalErrorHandler: ((title: string, message: string) => void) | null = null;

export const setGlobalErrorHandler = (handler: (title: string, message: string) => void) => {
  globalErrorHandler = handler;
};

const showError = (title: string, message: string) => {
  if (globalErrorHandler) {
    globalErrorHandler(title, message);
  } else {
    Alert.alert(title, message);
  }
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError<any>) => {
    let errorTitle = 'Error';
    let errorMessage = 'Something went wrong. Please try again.';

    if (error.response) {
      console.error(`[API Error] ${error.response.status} ${error.config?.url}`, error.response.data);
      
      const status = error.response.status;
      const data = error.response.data;

      // Extract error message from response
      const apiError = data?.error || data?.message || '';

      switch (status) {
        case 400:
          errorTitle = 'Invalid Request';
          errorMessage = apiError || 'Please check your input and try again.';
          break;

        case 401:
          // Check if it's a token expiration
          if (apiError.toLowerCase().includes('token') || apiError.toLowerCase().includes('expired') || apiError.toLowerCase().includes('invalid')) {
            errorTitle = 'Session Expired';
            errorMessage = 'Your session has expired. Please sign in again.';
            // Clear auth data
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('auth_user');
          } else {
            errorTitle = 'Unauthorized';
            errorMessage = apiError || 'Please sign in to continue.';
          }
          break;

        case 403:
          errorTitle = 'Access Denied';
          errorMessage = apiError || 'You don\'t have permission to perform this action.';
          break;

        case 404:
          errorTitle = 'Not Found';
          errorMessage = apiError || 'The requested resource was not found.';
          break;

        case 409:
          errorTitle = 'Conflict';
          errorMessage = apiError || 'This action conflicts with existing data.';
          break;

        case 422:
          errorTitle = 'Validation Error';
          errorMessage = apiError || 'Please check your input and try again.';
          break;

        case 429:
          errorTitle = 'Too Many Requests';
          errorMessage = 'You\'re making too many requests. Please wait a moment and try again.';
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          errorTitle = 'Server Error';
          errorMessage = 'Our servers are experiencing issues. Please try again later.';
          break;

        default:
          errorMessage = apiError || errorMessage;
      }

      // Show error to user
      showError(errorTitle, errorMessage);

    } else if (error.request) {
      // Network error - no response received
      console.error('[API Error] Network error', error.message);
      errorTitle = 'Network Error';
      errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      showError(errorTitle, errorMessage);

    } else {
      // Something else happened
      console.error('[API Error] Request setup error', error.message);
      errorMessage = error.message || errorMessage;
      showError(errorTitle, errorMessage);
    }

    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

export interface User {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  user_type: 'customer' | 'dealer';
  company_name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  udyam_number?: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refresh_token: string;
}

export interface Product {
  product_id: number;
  product_name: string;
  product_type: 'pellets' | 'biomass-stove' | 'biomass-burner';
  description: string;
  base_price: number;
  category: string;
  gcv?: string;
  ash_content?: string;
  moisture_content?: string;
  tag?: string;
  tag_color?: string;
  suitable_for?: string;
  image_url?: string;
  is_available: boolean;
}

export interface ProductConfiguration {
  config_id: number;
  product_id: number;
  size: string;
  purpose: string;
  price: number;
  is_available: boolean;
}

export interface OrderItem {
  product_id: number;
  config_id?: number;
  quantity: number;
  size: string;
  purpose: string;
  sub_purpose?: string;
}

export interface CreateOrderRequest {
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_pincode: string;
  payment_method?: string;
  notes?: string;
  items: OrderItem[];
}

export interface Order {
  order_id: number;
  order_number: string;
  user_id: number;
  total_amount: number;
  delivery_fee: number;
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_pincode: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// API Service
export const api = {
  // ============================================
  // Authentication
  // ============================================
  auth: {
    register: async (data: {
      name: string;
      email: string;
      phone: string;
      password: string;
      user_type: 'customer' | 'dealer';
      company_name?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      gst_number?: string;
      udyam_number?: string;
    }): Promise<ApiResponse<AuthResponse>> => {
      const response = await apiClient.post('/auth/register', data);
      return response.data;
    },

    login: async (credentials: {
      phone?: string;
      email?: string;
      password: string;
    }): Promise<ApiResponse<AuthResponse>> => {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    },

    logout: async (refreshToken: string): Promise<ApiResponse> => {
      const response = await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      return response.data;
    },

    me: async (): Promise<ApiResponse<User>> => {
      const response = await apiClient.get('/auth/me');
      return response.data;
    },

    refresh: async (refreshToken: string): Promise<ApiResponse<{ token: string; refresh_token: string }>> => {
      const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
      return response.data;
    },

    forgotPassword: async (identifier: { phone?: string; email?: string }): Promise<ApiResponse> => {
      const response = await apiClient.post('/auth/forgot-password', identifier);
      return response.data;
    },

    sendOtp: async (data: { email: string }): Promise<ApiResponse<{
      message: string;
      identifier: string;
      type: string;
      purpose: string;
      expires_in: number;
    }>> => {
      const response = await apiClient.post('/auth/send-otp', data);
      return response.data;
    },

    verifyOtp: async (data: { identifier: string; otp: string }): Promise<ApiResponse<{ reset_token: string }>> => {
      const response = await apiClient.post('/auth/verify-otp', data);
      return response.data;
    },

    resetPassword: async (
      data: { new_password: string; confirm_password: string },
      resetToken?: string
    ): Promise<ApiResponse> => {
      const config = resetToken ? {
        headers: {
          'Authorization': `Bearer ${resetToken}`
        }
      } : {};
      const response = await apiClient.post('/auth/reset-password', data, config);
      return response.data;
    },
  },

  // ============================================
  // Products
  // ============================================
  products: {
    getAll: async (params?: {
      product_type?: string;
      category?: string;
      is_available?: boolean;
      page?: number;
      limit?: number;
    }): Promise<ApiResponse<{ data: Product[]; pagination: any }>> => {
      const response = await apiClient.get('/products', { params });
      return response.data;
    },

    getById: async (id: number): Promise<ApiResponse<Product>> => {
      const response = await apiClient.get(`/products/${id}`);
      return response.data;
    },

    getConfigurations: async (
      productId: number,
      params?: { size?: string; purpose?: string; is_available?: boolean }
    ): Promise<ApiResponse<ProductConfiguration[]>> => {
      const response = await apiClient.get(`/products/${productId}/configurations`, { params });
      return response.data;
    },

    getAvailableSizes: async (productId: number): Promise<ApiResponse<{
      product_id: number;
      product_name: string;
      available_sizes: string[];
    }>> => {
      const response = await apiClient.get(`/products/${productId}/sizes`);
      return response.data;
    },

    getPriceBySize: async (
      productId: number,
      size: string,
      purpose?: string
    ): Promise<ApiResponse<{
      product_id: number;
      product_name: string;
      size: string;
      purpose: string;
      config_id: number | null;
      price: number;
      source: 'config' | 'base_price';
    }>> => {
      const params = purpose ? { size, purpose } : { size };
      const response = await apiClient.get(`/products/${productId}/price`, { params });
      return response.data;
    },
  },

  // ============================================
  // Orders
  // ============================================
  orders: {
    getAll: async (params?: {
      order_status?: string;
      payment_status?: string;
      page?: number;
      limit?: number;
    }): Promise<ApiResponse<{ data: Order[]; pagination: any }>> => {
      const response = await apiClient.get('/orders', { params });
      return response.data;
    },

    create: async (orderData: CreateOrderRequest): Promise<ApiResponse<Order>> => {
      const response = await apiClient.post('/orders', orderData);
      return response.data;
    },

    getById: async (id: number): Promise<ApiResponse<{ order: Order; items: any[] }>> => {
      const response = await apiClient.get(`/orders/${id}`);
      return response.data;
    },

    updateStatus: async (
      id: number,
      data: { order_status?: string; payment_status?: string; notes?: string }
    ): Promise<ApiResponse> => {
      const response = await apiClient.put(`/orders/${id}/status`, data);
      return response.data;
    },
  },

  // ============================================
  // Users
  // ============================================
  users: {
    getById: async (id: number): Promise<ApiResponse<User>> => {
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    },

    update: async (id: number, data: Partial<User>): Promise<ApiResponse<User>> => {
      const response = await apiClient.put(`/users/${id}`, data);
      return response.data;
    },

    updatePassword: async (
      id: number,
      data: { current_password: string; new_password: string; confirm_password: string }
    ): Promise<ApiResponse> => {
      const response = await apiClient.put(`/users/${id}/password`, data);
      return response.data;
    },

    getOrders: async (userId: number, params?: any): Promise<ApiResponse<Order[]>> => {
      const response = await apiClient.get(`/users/${userId}/orders`, { params });
      return response.data;
    },
  },

  // ============================================
  // Statistics
  // ============================================
  statistics: {
    getOrders: async (params?: { days?: number; from_date?: string; to_date?: string }): Promise<ApiResponse> => {
      const response = await apiClient.get('/statistics/orders', { params });
      return response.data;
    },

    getActiveOrders: async (): Promise<ApiResponse> => {
      const response = await apiClient.get('/statistics/active-orders');
      return response.data;
    },
  },
};

export default api;