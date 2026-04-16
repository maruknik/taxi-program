import { useState, useEffect } from 'react';
import { useDriverLocation } from './useDriverLocation';
import { LocationWithAddress } from '@/src/types';

interface ETACalculationProps {
  rideId: string | null;
  destination: LocationWithAddress | null;
  rideStatus: string;
}

export function useETACalculation({ rideId, destination, rideStatus }: ETACalculationProps) {
  const [eta, setETA] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const { data: driverLocation } = useDriverLocation(
    rideId, 
    rideStatus === 'accepted' || rideStatus === 'in_progress'
  );

  useEffect(() => {
    if (!driverLocation || !destination) {
      setETA(null);
      return;
    }

    calculateETA();
  }, [driverLocation, destination]);

  const calculateETA = async () => {
    if (!driverLocation || !destination) return;

    setIsCalculating(true);
    
    try {
      // Використовуємо Google Directions API для розрахунку ETA
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${driverLocation.latitude},${driverLocation.longitude}&` +
        `destination=${destination.latitude},${destination.longitude}&` +
        `mode=driving&departure_time=now&traffic_model=best_guess&` +
        `key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        // Використовуємо час з урахуванням трафіку якщо доступно
        const duration = leg.duration_in_traffic || leg.duration;
        const etaMinutes = Math.max(1, Math.round(duration.value / 60));
        
        setETA(etaMinutes);
      } else {
        console.error('Failed to calculate ETA:', data.status);
        setETA(null);
      }
    } catch (error) {
      console.error('Error calculating ETA:', error);
      setETA(null);
    } finally {
      setIsCalculating(false);
    }
  };

  return {
    eta,
    isCalculating,
    driverLocation,
    recalculateETA: calculateETA,
  };
}
