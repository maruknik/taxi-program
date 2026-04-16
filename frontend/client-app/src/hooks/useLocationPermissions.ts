import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export function useLocationPermissions() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking location permissions:', error);
      setHasPermission(false);
    }
  };

  const requestPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      setHasPermission(false);
      return false;
    }
  };

  return {
    hasPermission,
    requestPermission,
    checkPermissions,
  };
}
