import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface UseLocationReturn {
  location: LocationCoords | null;
  loading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
  hasPermission: boolean | null;
  requestPermission: () => Promise<boolean>;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      
      setHasPermission(granted);
      
      if (!granted) {
        setError('Дозвіл на використання локації відхилено');
        Alert.alert(
          'Потрібен дозвіл',
          'Для роботи додатку необхідно надати доступ до вашої локації.',
          [
            { text: 'OK' },
          ]
        );
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Permission request error:', err);
      setError('Помилка при запиті дозволу на локацію');
      setHasPermission(false);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const hasPermission = await requestLocationPermission();
      
      if (!hasPermission) {
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      
      setError(null);
    } catch (err) {
      setError('Не вдалося отримати вашу локацію');
      console.error('Get location error:', err);
      
      // Fallback до Києва якщо не вдалося отримати локацію (або можна залишити null)
      setLocation({
        latitude: 50.4501,
        longitude: 30.5234,
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshLocation = async () => {
    await getCurrentLocation();
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return {
    location,
    loading,
    error,
    refreshLocation,
    hasPermission,
    requestPermission: requestLocationPermission,
  };
}
