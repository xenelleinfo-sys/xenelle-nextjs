// services/api.service.ts

import { API_BASE_URL } from "../utils/urls";

export interface PaginatedResponse<T> {
  success: boolean;
  result: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiResponse<T> {
  cached: boolean;
  count?: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    page: number;
    limit: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    total: number;
    totalCount: number;
  };
  success: boolean;
  result?: T;
  data?: T;
  error?: T;
  stats?: T;
  message?: string;
  graph?: T;
  products?: T;
  fineamount?: number;
  orders?: T;
  order?: T;
  period?: T;
  groupBy?: T;
  wallets?: T;
  reviews?: T;
  totalCount?: T;
}
class ApiService {
  private getAuthHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async get<T>(
    endpoint: string,
    options?: RequestInit,
    token?: string
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = token
        ? { ...this.getAuthHeaders(), Authorization: `Bearer ${token}` }
        : this.getAuthHeaders();

      const response = await fetch(url, {
        method: "GET",
        headers,
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }
      return data;
    } catch (error) {
      console.error(`API Error (GET ${endpoint}):`, error);
      throw error;
    }
  }

  async post<T, D extends object = Record<string, unknown>>(
    endpoint: string,
    data: D,
    token?: string
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = token
        ? { ...this.getAuthHeaders(), Authorization: `Bearer ${token}` }
        : this.getAuthHeaders();

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Something went wrong");
      }

      return responseData;
    } catch (error) {
      console.error(`API Error (POST ${endpoint}):`, error);
      throw error;
    }
  }

  async put<T, D extends object = Record<string, unknown>>(
    endpoint: string,
    data: D,
    token?: string
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = token
        ? { ...this.getAuthHeaders(), Authorization: `Bearer ${token}` }
        : this.getAuthHeaders();

      const response = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Something went wrong");
      }

      return responseData;
    } catch (error) {
      console.error(`API Error (PUT ${endpoint}):`, error);
      throw error;
    }
  }

  async patch<T, D extends object = Record<string, unknown>>(
    endpoint: string,
    data: D,
    token?: string
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = token
        ? { ...this.getAuthHeaders(), Authorization: `Bearer ${token}` }
        : this.getAuthHeaders();

      const response = await fetch(url, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Something went wrong");
      }

      return responseData;
    } catch (error) {
      console.error(`API Error (PATCH ${endpoint}):`, error);
      throw error;
    }
  }

  async delete<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = token
        ? { ...this.getAuthHeaders(), Authorization: `Bearer ${token}` }
        : this.getAuthHeaders();

      const response = await fetch(url, {
        method: "DELETE",
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      return data;
    } catch (error) {
      console.error(`API Error (DELETE ${endpoint}):`, error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
