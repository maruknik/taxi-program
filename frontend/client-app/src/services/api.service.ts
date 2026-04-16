import { apiClient } from '@/src/lib/api';
import { AxiosResponse } from 'axios';

// Generic GET request
export async function get<T>(url: string): Promise<T> {
  const response: AxiosResponse<T> = await apiClient.get(url);
  return response.data;
}

// Generic POST request
export async function post<T, D = any>(url: string, data?: D): Promise<T> {
  const response: AxiosResponse<T> = await apiClient.post(url, data);
  return response.data;
}

// Generic PUT request
export async function put<T, D = any>(url: string, data: D): Promise<T> {
  const response: AxiosResponse<T> = await apiClient.put(url, data);
  return response.data;
}

// Generic PATCH request
export async function patch<T, D = any>(url: string, data: D): Promise<T> {
  const response: AxiosResponse<T> = await apiClient.patch(url, data);
  return response.data;
}

// Generic DELETE request
export async function del<T>(url: string): Promise<T> {
  const response: AxiosResponse<T> = await apiClient.delete(url);
  return response.data;
}
