import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '@/src/lib/api';
import { PaymentMethod, AddCardData } from '@/src/types/payment.types';

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const response = await paymentApi.getPaymentMethods();
      return response.data as PaymentMethod[];
    },
  });
}

export function useAddCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cardData: AddCardData) => paymentApi.addCard(cardData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentApi.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

export function useRemovePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}
