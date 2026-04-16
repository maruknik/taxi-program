import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Дані вважаються "свіжими" протягом 5 хвилин
      staleTime: 5 * 60 * 1000,
      
      // Дані зберігаються в кеші 10 хвилин після того, як вони стали неактивними
      gcTime: 10 * 60 * 1000,
      
      // Кількість спроб при помилці
      retry: 2,
      
      // Затримка між спробами (exponential backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Вимикаємо автоматичний refetch при фокусі вікна (для мобільних зазвичай не потрібно)
      refetchOnWindowFocus: false,
      
      // Оновлювати при відновленні мережі
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
