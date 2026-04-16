import { useState, useEffect, useRef } from 'react';
import { useDriverLocation } from './useDriverLocation';
import { LocationWithAddress } from '@/src/types';
import { apiClient } from '@/src/lib/api';

interface ETAData {
  eta_minutes: number;
  distance_meters: number;
  distance_text: string;
  duration_seconds: number;
  duration_text: string;
  traffic_duration_seconds?: number;
  traffic_duration_text?: string;
  traffic_condition: 'light' | 'moderate' | 'heavy' | 'unknown';
  polyline: string;
  calculated_at: string;
}

interface AdvancedETAProps {
  rideId: string | null;
  destination: LocationWithAddress | null;
  rideStatus: string;
  updateInterval?: number;
}

export function useAdvancedETA({ 
  rideId, 
  destination, 
  rideStatus,
  updateInterval = 30000 // 30 секунд
}: AdvancedETAProps) {
  const [etaData, setETAData] = useState<ETAData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const { data: driverLocation } = useDriverLocation(
    rideId, 
    rideStatus === 'accepted' || rideStatus === 'in_progress'
  );
  
  const intervalRef = useRef<any>(null);
  const lastCalculationRef = useRef<string>('');

  // Розрахувати ETA при зміні локації водія
  useEffect(() => {
    if (driverLocation && destination) {
      const locationKey = `${driverLocation.latitude},${driverLocation.longitude}`;
      
      // Уникнути повторних розрахунків для тієї ж локації
      if (locationKey !== lastCalculationRef.current) {
        lastCalculationRef.current = locationKey;
        calculateETA();
      }
    }
  }, [driverLocation, destination]);

  // Періодичне оновлення ETA
  useEffect(() => {
    if (rideStatus === 'accepted' || rideStatus === 'in_progress') {
      startPeriodicUpdate();
    } else {
      stopPeriodicUpdate();
    }

    return () => stopPeriodicUpdate();
  }, [rideStatus, updateInterval]);

  const calculateETA = async (force: boolean = false) => {
    if (!driverLocation || !destination || isCalculating) return;

    setIsCalculating(true);
    setError(null);
    
    try {
      // Використовуємо backend ETA service для точних розрахунків
      const response = await apiClient.post('/rides/calculate-eta/', {
        origin_lat: driverLocation.latitude,
        origin_lng: driverLocation.longitude,
        dest_lat: destination.latitude,
        dest_lng: destination.longitude,
        departure_time: 'now',
        force_update: force,
      });

      const newETAData: ETAData = response.data;
      setETAData(newETAData);
      setLastUpdate(new Date());
      
      // Логування для debugging
      console.log('ETA calculated:', {
        eta: newETAData.eta_minutes,
        traffic: newETAData.traffic_condition,
        distance: newETAData.distance_text,
      });
      
    } catch (err) {
      console.error('Failed to calculate ETA:', err);
      setError(err instanceof Error ? err.message : 'ETA calculation failed');
      
      // Fallback до простого розрахунку
      try {
        const fallbackETA = await calculateFallbackETA();
        if (fallbackETA) {
          setETAData(fallbackETA);
        }
      } catch (fallbackError) {
        console.error('Fallback ETA calculation failed:', fallbackError);
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateFallbackETA = async (): Promise<ETAData | null> => {
    if (!driverLocation || !destination) return null;

    // Простий розрахунок на основі відстані
    const distance = getDistanceFromLatLonInKm(
      driverLocation.latitude,
      driverLocation.longitude,
      destination.latitude,
      destination.longitude
    );

    // Припустимо середню швидкість 30 км/год в місті
    const averageSpeed = 30;
    const etaMinutes = Math.max(1, Math.round((distance / averageSpeed) * 60));

    return {
      eta_minutes: etaMinutes,
      distance_meters: Math.round(distance * 1000),
      distance_text: `${distance.toFixed(1)} км`,
      duration_seconds: etaMinutes * 60,
      duration_text: `${etaMinutes} хв`,
      traffic_condition: 'unknown',
      polyline: '',
      calculated_at: new Date().toISOString(),
    };
  };

  const getDistanceFromLatLonInKm = (
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  const startPeriodicUpdate = () => {
    stopPeriodicUpdate();
    
    intervalRef.current = setInterval(() => {
      if (driverLocation && destination) {
        calculateETA();
      }
    }, updateInterval);
  };

  const stopPeriodicUpdate = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const forceUpdate = () => {
    calculateETA(true);
  };

  const getTrafficColor = (): string => {
    if (!etaData) return '#6B38FB';
    
    switch (etaData.traffic_condition) {
      case 'light': return '#10B981'; // green
      case 'moderate': return '#F59E0B'; // yellow
      case 'heavy': return '#EF4444'; // red
      default: return '#6B38FB'; // primary
    }
  };

  const getTrafficText = (): string => {
    if (!etaData) return '';
    
    switch (etaData.traffic_condition) {
      case 'light': return 'Легкий трафік';
      case 'moderate': return 'Помірний трафік';
      case 'heavy': return 'Щільний трафік';
      default: return '';
    }
  };

  return {
    etaData,
    eta: etaData?.eta_minutes || null,
    isCalculating,
    error,
    lastUpdate,
    driverLocation,
    trafficColor: getTrafficColor(),
    trafficText: getTrafficText(),
    forceUpdate,
    recalculateETA: () => calculateETA(true),
  };
}
