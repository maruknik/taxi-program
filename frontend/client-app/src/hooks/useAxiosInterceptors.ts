import { useAuth } from "@clerk/expo";
import { useEffect } from "react";
import { apiClient } from "../lib/api";

export const useAxiosInterceptors = () => {
  const { getToken } = useAuth();

  useEffect(() => {
    // Request interceptor - додає JWT токен
    const requestInterceptor = apiClient.interceptors.request.use(
      async (config) => {
        try {
          const token = await getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error("Помилка отримання токену", error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor - обробка помилок
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => {
        // Успішна відповідь - повертаємо як є
        return response;
      },
      async (error) => {
        // Обробка помилок
        if (error.response) {
          // Сервер відповів з помилкою
          const status = error.response.status;
          
          if (status === 401) {
            // Unauthorized - токен застарілий або невалідний
            console.error("Unauthorized - access denied");
          } else if (status === 403) {
            // Forbidden - немає доступу
            console.error("Forbidden - access denied");
          } else if (status === 404) {
            // Not Found — деякі 404 є очікуваними (наприклад, driver-location до призначення водія)
            const url = error.config?.url || '';
            if (!url.includes('driver-location')) {
              console.error("Resource not found:", url);
            }
          } else if (status >= 500) {
            // Server Error
            console.error("Server error:", error.response.data);
          }
        } else if (error.request) {
          // Запит відправлено але немає відповіді
          console.error("No response from server");
        } else {
          // Помилка при налаштуванні запиту
          console.error("Request setup error:", error.message);
        }
        
        return Promise.reject(error);
      },
    );

    // Очищення interceptors при unmount
    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, [getToken]);
};
