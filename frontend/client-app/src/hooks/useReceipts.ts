import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/api';
import * as FileSystem from 'expo-file-system';

export interface ReceiptData {
  receipt_id: string;
  ride_id: string;
  date: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  driver?: {
    name: string;
    phone: string;
    vehicle: string;
    plate: string;
  };
  route: {
    pickup_address: string;
    dropoff_address: string;
    distance_km: number;
    duration_minutes: number;
  };
  payment: {
    method: string;
    amount: number;
    currency: string;
    transaction_id: string;
  };
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
}

export function useReceipt(rideId: string | null) {
  return useQuery({
    queryKey: ['receipt', rideId],
    queryFn: async (): Promise<ReceiptData> => {
      const response = await apiClient.get(`/payments/receipts/receipt/?ride_id=${rideId}`);
      return response.data;
    },
    enabled: !!rideId,
  });
}

export function useDownloadReceipt() {
  return useMutation({
    mutationFn: async (rideId: string): Promise<string> => {
      // Get receipt data first
      const response = await apiClient.get(
        `/payments/receipts/receipt/?ride_id=${rideId}`
      );
      
      // For now, just return receipt ID - PDF download can be implemented later
      return `Receipt ${response.data.receipt_id}`;
    },
  });
}

export function useEmailReceipt() {
  return useMutation({
    mutationFn: async (data: { ride_id: string; email?: string }) => {
      const response = await apiClient.post('/payments/receipts/email_receipt/', data);
      return response.data;
    },
  });
}

