import { useQuery } from '@tanstack/react-query';
import { get } from '@/src/services/api.service';
import { queryKeys } from '@/src/lib/queryKeys';
import { Ride, PaginatedResponse } from '@/src/types';

export function useRides() {
  return useQuery({
    queryKey: queryKeys.rides.all,
    queryFn: () => get<PaginatedResponse<Ride>>('/rides/'),
    staleTime: 2 * 60 * 1000, // 2 хвилини
  });
}

export function useActiveRide() {
  return useQuery({
    queryKey: queryKeys.rides.active,
    queryFn: () => get<Ride | null>('/rides/active/'),
    staleTime: 10 * 1000, // 10 секунд (часто оновлюється)
    refetchInterval: 10 * 1000, // Polling кожні 10 секунд
  });
}

export function useRideById(rideId: string) {
  return useQuery({
    queryKey: queryKeys.rides.byId(rideId),
    queryFn: () => get<Ride>(`/rides/${rideId}/`),
    enabled: !!rideId, // Тільки якщо rideId існує
  });
}
