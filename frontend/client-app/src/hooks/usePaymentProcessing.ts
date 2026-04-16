import { useMutation, useQuery } from '@tanstack/react-query';
import { paymentApi } from '@/src/lib/api';

export interface PaymentIntent {
  payment_id: string;
  status: 'completed' | 'requires_confirmation' | 'failed';
  payment_method: 'cash' | 'card';
  requires_confirmation: boolean;
  client_secret?: string;
  checkout_url?: string;
  gateway_data?: any;
  error_code?: string;
  error_message?: string;
}

export interface Transaction {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: number;
  payment_method: 'cash' | 'card';
  error_message?: string;
  external_id?: string;
}

export function useProcessRidePayment() {
  return useMutation({
    mutationFn: async (data: {
      ride_id: string;
      payment_method_id: string;
      amount: number;
    }): Promise<PaymentIntent> => {
      const response = await paymentApi.processRidePayment(data);
      return response.data;
    },
  });
}

export function useConfirmPayment() {
  return useMutation({
    mutationFn: async (paymentId: string): Promise<Transaction> => {
      const response = await paymentApi.confirmPayment(paymentId);
      return response.data;
    },
  });
}

export function useTransactionStatus(transactionId: string | null) {
  return useQuery({
    queryKey: ['transaction-status', transactionId],
    queryFn: async (): Promise<Transaction> => {
      const response = await paymentApi.getTransaction(transactionId!);
      return response.data;
    },
    enabled: !!transactionId,
    refetchInterval: (query) => {
      const data = query.state.data as Transaction | undefined;
      // Stop polling if transaction is completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });
}

export function useRefundPayment() {
  return useMutation({
    mutationFn: async (data: {
      paymentId: string;
      amount?: number;
    }): Promise<any> => {
      const response = await paymentApi.refundPayment(data.paymentId, data.amount);
      return response.data;
    },
  });
}
