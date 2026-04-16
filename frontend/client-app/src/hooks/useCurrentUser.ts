import { useQuery } from '@tanstack/react-query';
import { get } from '@/src/services/api.service';
import { queryKeys } from '@/src/lib/queryKeys';
import { User } from '@/src/types';

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.users.me,
    queryFn: () => get<User>('/users/me/'),
    staleTime: 5 * 60 * 1000, // 5 хвилин
  });
}
