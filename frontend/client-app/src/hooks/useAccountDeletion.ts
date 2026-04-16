import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/api';
import { DeleteAccountRequest, DeletionStatus } from '@/src/types/deletion.types';

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: DeleteAccountRequest) => {
      const response = await apiClient.post('/users/delete_account/', data);
      return response.data;
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
    },
  });
}

export function useCancelDeletion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/users/cancel_deletion/');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'deletion-status'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}

export function useDeletionStatus() {
  return useQuery({
    queryKey: ['user', 'deletion-status'],
    queryFn: async (): Promise<DeletionStatus> => {
      const response = await apiClient.get('/users/deletion_status/');
      return response.data;
    },
  });
}
