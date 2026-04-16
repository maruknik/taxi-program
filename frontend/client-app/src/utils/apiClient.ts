// src/utils/apiClient.ts
import { useAuth } from "@clerk/expo";
import { useCallback } from "react";

/**
 * Базова URL адреса вашого Django-бекенду.
 *
 * ВАЖЛИВО:
 * - Для Android-емулятора: 10.0.2.2 (замість localhost)
 * - Для фізичного пристрою: IP-адреса вашого комп'ютера (наприклад, 192.168.0.100:8000)
 * - Для продакшн: https://api.yourapp.com
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:8000";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Хук для роботи з API-запитами.
 * Автоматично додає JWT-токен Clerk до кожного запиту.
 *
 * @example
 * const { get, post } = useApiClient();
 * const { data, error } = await get<UserProfile>("/api/users/me/");
 */
export function useApiClient() {
  const { getToken } = useAuth();

  const request = useCallback(
    async <T = unknown>(
      endpoint: string,
      method: HttpMethod = "GET",
      body?: object
    ): Promise<ApiResponse<T>> => {
      try {
        // Отримуємо актуальний JWT-токен від Clerk
        const token = await getToken();

        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        // Відповідь без тіла (204 No Content)
        if (response.status === 204) {
          return { data: null, error: null, status: 204 };
        }

        const json = await response.json();

        if (!response.ok) {
          const errorMessage =
            json?.detail ||
            json?.message ||
            json?.error ||
            Object.values(json)?.[0] ||
            `HTTP ${response.status}`;

          return {
            data: null,
            error: String(errorMessage),
            status: response.status,
          };
        }

        return { data: json as T, error: null, status: response.status };
      } catch (networkError: any) {
        console.error("API request failed:", networkError);
        return {
          data: null,
          error: networkError?.message ?? "Помилка мережевого з'єднання",
          status: 0,
        };
      }
    },
    [getToken]
  );

  return {
    get: <T = unknown>(endpoint: string) => request<T>(endpoint, "GET"),
    post: <T = unknown>(endpoint: string, body: object) => request<T>(endpoint, "POST", body),
    patch: <T = unknown>(endpoint: string, body: object) => request<T>(endpoint, "PATCH", body),
    put: <T = unknown>(endpoint: string, body: object) => request<T>(endpoint, "PUT", body),
    delete: <T = unknown>(endpoint: string) => request<T>(endpoint, "DELETE"),
  };
}
