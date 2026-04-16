import { useQuery } from '@tanstack/react-query';
import { get } from '@/src/services/api.service';
import { queryKeys } from '@/src/lib/queryKeys';
import { AvailableDriver } from '@/src/types';

interface AvailableDriversParams {
  latitude: number;
  longitude: number;
  radius?: number;
}

export function useAvailableDrivers(params: AvailableDriversParams | null) {
  return useQuery({
    queryKey: queryKeys.drivers.available(
      params?.latitude || 0,
      params?.longitude || 0
    ),
    queryFn: () => 
      get<AvailableDriver[]>(
        `/drivers/available/?lat=${params?.latitude}&lng=${params?.longitude}&radius=${params?.radius || 5}`
      ),
    enabled: !!(params?.latitude && params?.longitude),
    staleTime: 30 * 1000, // 30 секунд
    refetchInterval: 30 * 1000, // Polling кожні 30 секунд
  });
}
