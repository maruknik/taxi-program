import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/api';
import { Ride } from '@/src/types/ride.types';

export function useRideDetails(rideId: string | null) {
  return useQuery({
    queryKey: ['ride-details', rideId],
    queryFn: async () => {
      if (!rideId) return null;
      
      const response = await apiClient.get<Ride>(`/rides/${rideId}/`);
      return response.data;
    },
    enabled: !!rideId,
    staleTime: 5000,
    refetchInterval: 5000, // Refresh every 5s to pick up driver assignment
  });
}
