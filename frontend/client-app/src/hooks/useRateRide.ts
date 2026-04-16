import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/api';
import { useRideStore } from '@/src/store/useRideStore';
import { useRouter } from 'expo-router';

interface RateRideRequest {
  rideId: string;
  rating: number;
  comment?: string;
}

export function useRateRide() {
  const queryClient = useQueryClient();
  const { resetRide } = useRideStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ rideId, rating, comment }: RateRideRequest) => {
      const response = await apiClient.post(`/rides/${rideId}/rate/`, {
        rating,
        comment: comment || '',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      resetRide();
      router.replace('/main');
    },
    onError: (error) => {
      console.error('Rate ride error:', error);
    },
  });
}