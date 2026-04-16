import { Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/api';
import { Ride, CreateRideDto } from '@/src/types/ride.types';
import { useRideStore } from '@/src/store/useRideStore';

interface CreateRideRequest {
  pickup_lat: number;
  pickup_lon: number;
  dropoff_lat: number;
  dropoff_lon: number;
  pickup_address: string;
  dropoff_address: string;
  vehicle_type: string;
}

export function useCreateRide() {
  const queryClient = useQueryClient();
  const { setCurrentRideId, setRideStatus } = useRideStore();

  return useMutation({
    mutationFn: async (data: CreateRideRequest): Promise<Ride> => {
      const response = await apiClient.post('/rides/create_ride/', data);
      return response.data;
    },
    onSuccess: (ride) => {
      setCurrentRideId(ride.id);
      setRideStatus('searching');
      queryClient.invalidateQueries({ queryKey: ['rides'] });
    },
    onError: (error: any) => {
      console.error('Create ride error:', error);
      console.error('Error response data:', error.response?.data);
      
      const errorMessage = error.response?.data?.error;
      if (errorMessage === 'User already has an active ride') {
        Alert.alert(
          'Активна поїздка',
          'У вас вже є активна поїздка. Спочатку скасуйте її або завершіть.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Помилка', 'Не вдалося створити замовлення');
      }
      
      setRideStatus('idle');
    },
  });
}
