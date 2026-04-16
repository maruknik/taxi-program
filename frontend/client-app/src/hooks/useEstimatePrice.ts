import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/api';
import { PriceEstimateResponse } from '@/src/types/ride.types';

interface EstimatePriceRequest {
  pickup_lat: number;
  pickup_lon: number;
  dropoff_lat: number;
  dropoff_lon: number;
  vehicle_type: string;
}

export function useEstimatePrice() {
  return useMutation({
    mutationFn: async (data: EstimatePriceRequest): Promise<PriceEstimateResponse> => {
      const response = await apiClient.post('/rides/estimate/', data);
      return response.data;
    },
    onError: (error: any) => {
      console.error('Price estimation error:', error);
      console.error('Error response:', error.response?.data);
    },
  });
}
