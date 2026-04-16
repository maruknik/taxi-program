import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/api';
import { Ride } from '@/src/types/ride.types';

interface RideStatusResponse {
  id: string;
  status: string;
  driver_location?: {
    latitude: number;
    longitude: number;
    updated_at: string;
  };
  estimated_arrival?: number; // minutes
}

export function useRideStatus(rideId: string | null) {
  return useQuery({
    queryKey: ['ride-status', rideId],
    queryFn: async () => {
      if (!rideId) return null;
      
      const response = await apiClient.get<RideStatusResponse>(`/rides/${rideId}/status/`);
      return response.data;
    },
    enabled: !!rideId,
    refetchInterval: (query) => {
      // Poll more frequently during active ride
      const data = query.state.data;
      if (!data?.status) return false;
      
      switch (data.status) {
        case 'searching':
        case 'accepted':
        case 'driver_arrived':
        case 'in_progress':
          return 3000; // Poll every 3 seconds during active ride
        case 'completed':
        case 'cancelled':
          return false; // Stop polling when ride is finished
        default:
          return 5000; // Default polling
      }
    },
    staleTime: 1000, // Consider data stale after 1 second
  });
}

export function usePollRideStatus(rideId: string | null, onStatusChange?: (status: string) => void) {
  const query = useRideStatus(rideId);
  const data = query.data;
  
  // React to status changes
  React.useEffect(() => {
    if (data?.status && onStatusChange) {
      onStatusChange(data.status);
    }
  }, [data?.status, onStatusChange]);
  
  return {
    ...query,
    status: data?.status,
    driverLocation: data?.driver_location,
    estimatedArrival: data?.estimated_arrival,
  };
}
