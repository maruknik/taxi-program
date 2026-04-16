import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/api';
import { ChangePasswordRequest, PasswordStrength, SecurityStatus } from '@/src/types/security.types';

export function useChangePassword() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      const response = await apiClient.post('/users/change_password/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'security-status'] });
    },
  });
}

export function useSecurityStatus() {
  return useQuery({
    queryKey: ['user', 'security-status'],
    queryFn: async (): Promise<SecurityStatus> => {
      const response = await apiClient.get('/users/security_status/');
      return response.data;
    },
  });
}

export function useCheckPasswordStrength() {
  return useMutation({
    mutationFn: async (password: string): Promise<PasswordStrength> => {
      const response = await apiClient.post('/users/check_password_strength/', {
        password
      });
      return response.data;
    },
  });
}
