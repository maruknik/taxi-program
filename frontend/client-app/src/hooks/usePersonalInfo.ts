import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/api';
import { 
  PersonalInfo, 
  UpdatePersonalInfoRequest,
  ChangeEmailRequest,
  PhoneVerificationRequest 
} from '@/src/types/user.types';

export function usePersonalInfo() {
  return useQuery({
    queryKey: ['user', 'personal-info'],
    queryFn: async (): Promise<PersonalInfo> => {
      const response = await apiClient.get('/users/profile/');
      return response.data;
    },
  });
}

export function useUpdatePersonalInfo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdatePersonalInfoRequest): Promise<PersonalInfo> => {
      const response = await apiClient.patch('/users/update_profile/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'personal-info'] });
    },
  });
}

export function useChangeEmail() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ChangeEmailRequest) => {
      const response = await apiClient.patch('/users/update_profile/', { email: data.new_email });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'personal-info'] });
    },
  });
}

export function usePhoneVerification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: PhoneVerificationRequest) => {
      const response = await apiClient.patch('/users/update_profile/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'personal-info'] });
    },
  });
}

export function useSendPhoneVerification() {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch('/users/update_profile/', {});
      return response.data;
    },
  });
}

export function useVerifyPhone() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: PhoneVerificationRequest) => {
      const response = await apiClient.patch('/users/update_profile/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'personal-info'] });
    },
  });
}

export function useResendEmailVerification() {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch('/users/update_profile/', {});
      return response.data;
    },
  });
}
