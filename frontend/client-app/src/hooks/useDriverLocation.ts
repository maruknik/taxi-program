import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/api';

interface DriverLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  updated_at: string;
}

export function useDriverLocation(rideId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['driver-location', rideId],
    queryFn: async (): Promise<DriverLocation> => {
      const response = await apiClient.get(`/rides/${rideId}/driver-location/`);
      return response.data;
    },
    enabled: !!rideId && enabled,
    refetchInterval: (query) => {
      // Припинити polling якщо є помилка 404 (водій не має локації)
      const error = query.state.error as any;
      if (error?.response?.status === 404) {
        return false;
      }
      
      // Припинити polling якщо дані застарілі або немає локації
      if (!query.state.data) return false;
      
      const data = query.state.data as any;
      const updatedAt = new Date(data.updated_at);
      const now = new Date();
      const timeDiff = now.getTime() - updatedAt.getTime();
      
      // Припинити якщо дані старіші 5 хвилин
      if (timeDiff > 5 * 60 * 1000) {
        return false;
      }
      
      return 5000; // 5 секунд
    },
    retry: (failureCount, error: any) => {
      // Не повторювати для 404 помилок (очікувана поведінка)
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: 1000,
    staleTime: 4000, // Дані стають застарілими через 4 секунди
  });
}
