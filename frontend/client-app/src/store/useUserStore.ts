import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UserPreferences {
  // Theme
  theme: "light" | "dark" | "system";
  
  // Language
  language: "uk" | "en";
  
  // Notifications
  pushNotificationsEnabled: boolean;
  
  // Ride preferences
  defaultRideType: "economy" | "comfort" | "business";
  
  // Map preferences
  mapType: "standard" | "satellite" | "hybrid";
  showTraffic: boolean;
}

interface UserState extends UserPreferences {
  // Actions
  setTheme: (theme: UserPreferences["theme"]) => void;
  setLanguage: (language: UserPreferences["language"]) => void;
  setPushNotifications: (enabled: boolean) => void;
  setDefaultRideType: (type: UserPreferences["defaultRideType"]) => void;
  setMapType: (type: UserPreferences["mapType"]) => void;
  setShowTraffic: (show: boolean) => void;
  resetPreferences: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: "system",
  language: "uk",
  pushNotificationsEnabled: true,
  defaultRideType: "economy",
  mapType: "standard",
  showTraffic: true,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      // Initial state
      ...defaultPreferences,

      // Actions
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setPushNotifications: (enabled) => set({ pushNotificationsEnabled: enabled }),
      setDefaultRideType: (type) => set({ defaultRideType: type }),
      setMapType: (type) => set({ mapType: type }),
      setShowTraffic: (show) => set({ showTraffic: show }),
      resetPreferences: () => set(defaultPreferences),
    }),
    {
      name: "user-preferences",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
