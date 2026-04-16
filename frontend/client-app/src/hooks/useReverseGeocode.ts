import { useQuery } from '@tanstack/react-query';
import { reverseGeocode } from '@/src/services/placesService';

export function useReverseGeocode(
  latitude: number | null,
  longitude: number | null
) {
  return useQuery({
    queryKey: ['reverse-geocode', latitude, longitude],
    queryFn: () => reverseGeocode(latitude!, longitude!),
    enabled: latitude !== null && longitude !== null,
    staleTime: 1000 * 60 * 10, // 10 хвилин
  });
}
