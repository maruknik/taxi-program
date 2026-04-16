import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/api';
import { 
  SavedAddress, 
  CreateSavedAddressRequest,
  GroupedAddresses,
  AddressSearchResult,
  RecentAddress 
} from '@/src/types/address.types';

export function useSavedAddresses() {
  return useQuery({
    queryKey: ['saved-addresses'],
    queryFn: async (): Promise<SavedAddress[]> => {
      const response = await apiClient.get('/locations/saved-addresses/');
      return response.data;
    },
  });
}

export function useGroupedAddresses() {
  return useQuery({
    queryKey: ['saved-addresses', 'grouped'],
    queryFn: async (): Promise<GroupedAddresses> => {
      const response = await apiClient.get('/locations/saved-addresses/by-type/');
      return response.data;
    },
  });
}

export function useCreateSavedAddress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateSavedAddressRequest): Promise<SavedAddress> => {
      const response = await apiClient.post('/locations/saved-addresses/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
    },
  });
}

export function useUpdateSavedAddress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { 
      id: string; 
      data: Partial<CreateSavedAddressRequest> 
    }): Promise<SavedAddress> => {
      const response = await apiClient.patch(`/locations/saved-addresses/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
    },
  });
}

export function useDeleteSavedAddress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/locations/saved-addresses/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
    },
  });
}

export function useAddressSearch() {
  return useMutation({
    mutationFn: async (query: string): Promise<AddressSearchResult[]> => {
      const response = await apiClient.get(`/locations/search/?q=${encodeURIComponent(query)}`);
      return response.data.results;
    },
  });
}

export function useRecentAddresses() {
  return useQuery({
    queryKey: ['recent-addresses'],
    queryFn: async (): Promise<RecentAddress[]> => {
      const response = await apiClient.get('/locations/recent/');
      return response.data;
    },
  });
}
