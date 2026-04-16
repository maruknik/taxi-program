import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { LocationWithAddress } from '@/src/types/location.types';

const STORAGE_KEYS = {
  HOME: 'saved_place_home',
  WORK: 'saved_place_work',
};

export function useSavedPlaces() {
  const [home, setHome] = useState<LocationWithAddress | null>(null);
  const [work, setWork] = useState<LocationWithAddress | null>(null);

  useEffect(() => {
    loadSavedPlaces();
  }, []);

  const loadSavedPlaces = async () => {
    try {
      const [homeData, workData] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.HOME),
        SecureStore.getItemAsync(STORAGE_KEYS.WORK),
      ]);

      if (homeData) setHome(JSON.parse(homeData));
      if (workData) setWork(JSON.parse(workData));
    } catch (error) {
      console.error('Error loading saved places:', error);
    }
  };

  const saveHome = async (location: LocationWithAddress) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.HOME, JSON.stringify(location));
      setHome(location);
    } catch (error) {
      console.error('Error saving home:', error);
    }
  };

  const saveWork = async (location: LocationWithAddress) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.WORK, JSON.stringify(location));
      setWork(location);
    } catch (error) {
      console.error('Error saving work:', error);
    }
  };

  return {
    home,
    work,
    saveHome,
    saveWork,
  };
}
