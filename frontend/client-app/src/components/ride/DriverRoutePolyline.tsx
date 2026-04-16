import React, { useEffect, useState } from 'react';
import { Polyline } from 'react-native-maps';
import { Colors } from '@/src/constants/theme';
import { getDrivingRouteCoordinates } from '@/src/services/placesService';

interface DriverRoutePolylineProps {
  driverLocation: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  strokeColor?: string;
  strokeWidth?: number;
}

export function DriverRoutePolyline({
  driverLocation,
  destination,
  strokeColor = Colors.primary,
  strokeWidth = 4,
}: DriverRoutePolylineProps) {
  const [routeCoordinates, setRouteCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  useEffect(() => {
    loadRoute();
  }, [driverLocation, destination]);

  const loadRoute = async () => {
    try {
      const coordinates = await getDrivingRouteCoordinates(
        driverLocation,
        destination
      );
      setRouteCoordinates(coordinates);
    } catch (error) {
      console.error('Failed to load driver route:', error);
      // Fallback: пряма лінія
      setRouteCoordinates([driverLocation, destination]);
    }
  };

  if (routeCoordinates.length < 2) {
    return null;
  }

  return (
    <Polyline
      coordinates={routeCoordinates}
      strokeColor={strokeColor}
      strokeWidth={strokeWidth}
      lineDashPattern={[5, 5]} // Пунктирна лінія для маршруту водія
    />
  );
}
