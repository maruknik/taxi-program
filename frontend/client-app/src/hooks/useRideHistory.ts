import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, rideApi } from '@/src/lib/api';

export interface RideHistoryItem {
  id: string;
  status: string;
  status_display: string;
  created_at: string;
  completed_at?: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_location: {
    latitude: number;
    longitude: number;
  };
  dropoff_location: {
    latitude: number;
    longitude: number;
  };
  distance_text: string;
  duration_text: string;
  final_amount: number;
  driver_info?: {
    id: string;
    name: string;
    rating: number;
    total_rides: number;
    phone: string;
    vehicle: {
      make: string;
      model: string;
      color: string;
      plate: string;
      year?: number;
    };
  };
  payment_info: {
    method: string;
    display_name: string;
    amount: number;
    currency: string;
  };
  user_rating?: number;
  user_comment?: string;
}

export function useRideHistory() {
  return useQuery({
    queryKey: ['ride-history'],
    queryFn: async (): Promise<RideHistoryItem[]> => {
      const response = await rideApi.getHistory();
      return Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
    },
  });
}

export function useRideDetail(rideId: string | null) {
  return useQuery({
    queryKey: ['ride-detail', rideId],
    queryFn: async (): Promise<RideHistoryItem> => {
      if (!rideId) {
        throw new Error('Ride ID is required');
      }
      const response = await rideApi.getDetails(rideId);
      return response.data;
    },
    enabled: !!rideId,
  });
}

export function useRepeatRide() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { ride_id: string; reverse_route?: boolean }) => {
      const response = await rideApi.repeatRide(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ride-history'] });
    },
  });
}
