import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import { useAuth } from "@clerk/expo";
import { createAuthenticatedAPI } from "@/services/api";

export interface UserLocation {
  latitude: number;
  longitude: number;
}

const LOCATION_UPDATE_INTERVAL_MS = 10000; // 10 seconds

export function useLocation(isOnline: boolean = true) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [address, setAddress] = useState<string>("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { getToken } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSentRef = useRef<{ lat: number; lon: number } | null>(null);

  const sendLocationToBackend = async (coords: UserLocation) => {
    // Skip if location hasn't changed significantly (< 10 meters)
    if (lastSentRef.current) {
      const dlat = Math.abs(coords.latitude - lastSentRef.current.lat);
      const dlon = Math.abs(coords.longitude - lastSentRef.current.lon);
      if (dlat < 0.0001 && dlon < 0.0001) return;
    }
    try {
      const api = createAuthenticatedAPI(getToken);
      await api.updateLocation(coords.latitude, coords.longitude);
      lastSentRef.current = { lat: coords.latitude, lon: coords.longitude };
    } catch {
      // Non-critical — silently ignore
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === "granted");

      if (status !== "granted") return;

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setLocation(coords);

      if (isOnline) {
        await sendLocationToBackend(coords);
      }

      // Reverse geocode for city name
      try {
        const [geo] = await Location.reverseGeocodeAsync(coords);
        if (geo) {
          const city = geo.city || geo.subregion || geo.region || "Невідоме місто";
          setAddress(city.toUpperCase());
        }
      } catch (_) {
        setAddress("МОЄ МІСТО");
      }
    })();
  }, []);

  // Periodically update location on backend while online
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isOnline) return;

    intervalRef.current = setInterval(async () => {
      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
        setLocation(coords);
        await sendLocationToBackend(coords);
      } catch {
        // ignore
      }
    }, LOCATION_UPDATE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOnline]);

  return { location, address, hasPermission };
}
