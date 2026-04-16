import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchPlaces, PlacePrediction } from '@/src/services/placesService';
import { useLocation } from './useLocation';

export function usePlacesAutocomplete(query: string) {
  const { location } = useLocation();
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce для зменшення кількості запитів
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ['places', debouncedQuery, location],
    queryFn: () => searchPlaces(debouncedQuery, location || undefined),
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 хвилин
  });

  return {
    predictions,
    isLoading,
  };
}
