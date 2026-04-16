import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/api';
import { Ride } from '@/src/types/ride.types';
import { useRideStore } from '@/src/store/useRideStore';

export function useCancelRide() {
  const queryClient = useQueryClient();
  const { setCurrentRideId, setRideStatus, resetRide } = useRideStore();

  return useMutation({
    mutationFn: async (rideId: string): Promise<Ride> => {
      const response = await apiClient.post(`/rides/${rideId}/cancel/`, { reason: 'cancelled_by_user' });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      // Delay store reset so navigation (router.replace) fires before re-render
      setTimeout(() => {
        setCurrentRideId(null);
        setRideStatus('idle');
        resetRide();
      }, 100);
    },
    onError: (error: any) => {
      console.error('Cancel ride error:', error);
      console.error('Cancel ride error response:', error.response?.data);
      setRideStatus('idle');
    },
  });
}
