import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/api';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string;
  profile_image: string;
  date_of_birth: string;
  city: string;
  language: string;
  gender: string;
  gender_display: string;
  age: number | null;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  total_rides: number;
  total_spent: number;
  average_rating: number;
  profile_completion: number;
}

export interface UserStats {
  total_rides: number;
  total_spent: number;
  average_rating: number;
  profile_completion: number;
  rides_this_month: number;
  spent_this_month: number;
  favorite_pickup_address: string | null;
  favorite_dropoff_address: string | null;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_image?: string;
  date_of_birth?: string;
  city?: string;
  language?: string;
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<UserProfile> => {
      const response = await apiClient.get('/users/profile/');
      return response.data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateProfileData): Promise<UserProfile> => {
      const response = await apiClient.patch('/users/update_profile/', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: async (): Promise<UserStats> => {
      const response = await apiClient.get('/users/stats/');
      return response.data;
    },
  });
}
