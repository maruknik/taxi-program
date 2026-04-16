# Крок 3.1: Налаштування State Management та API (TanStack Query, Axios, Zustand)

У цьому кроці ми підключимо необхідні інструменти для роботи з даними (запити до бекенду) та глобальним станом додатку.

## 1. Встановлення залежностей

Запустіть у терміналі (в папці `client-app`):
```bash
npm install @tanstack/react-query axios zustand
```

## 2. Налаштування Axios з Clerk (Авторизація)

Оскільки бекенд (Django) вимагатиме JWT токен для захищених запитів, нам потрібно автоматично додавати його до кожного API виклику. Найзручніший спосіб у React Native — створити Axios інстанс та підключити до нього "перехоплювач" (interceptor), який братиме токен із сесії Clerk.

Спочатку створимо базовий Axios-клієнт у файлі `src/lib/api.ts` (якщо папки `lib` ще немає — створіть її):
```typescript
// src/lib/api.ts
import axios from "axios";

// Замініть шлях на ваш локальний або продакшн URL вашого Django бекенду
const baseURL = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});
```

Далі створимо хук-обгортку `src/hooks/useAxiosInterceptors.ts`, який динамічно додаватиме JWT-токен із Clerk:
```typescript
// src/hooks/useAxiosInterceptors.ts
import { useAuth } from "@clerk/expo";
import { useEffect } from "react";
import { apiClient } from "../lib/api";

export const useAxiosInterceptors = () => {
  const { getToken } = useAuth();

  useEffect(() => {
    const requestInterceptor = apiClient.interceptors.request.use(
      async (config) => {
        try {
          const token = await getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error("Помилка отримання токену", error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Очищення інтерцептора при розмонтуванні компонентів
    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
    };
  }, [getToken]);
};
```

## 3. Налаштування TanStack Query (React Query)

Тепер нам потрібно обгорнути наш додаток у `QueryClientProvider` та викликати наш хук інтерцепторів, щоб він активувався на старті додатку.

Відкрийте файл `app/_layout.tsx` і внесіть ці зміни (враховуючи існуючий код Clerk):

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAxiosInterceptors } from "@/src/hooks/useAxiosInterceptors";
import { Stack } from "expo-router";

// 1. Створюємо екземпляр QueryClient за межами компонента, 
// щоб він не перестворювався при кожному рендері
const queryClient = new QueryClient();

// 2. Дочірній компонент для ініціалізації логіки, яка потребує контексту Clerk 
// (оскільки хук useAuth з useAxiosInterceptors працює лише всередині ClerkProvider)
function AppContent() {
  // Активуємо перехоплювач Axios 
  useAxiosInterceptors();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  // ... ваш існуючий код конфігурації Clerk ...

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        {/* 3. Огортаємо додаток у QueryClientProvider */}
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
```

## 4. Створення базового стору за допомогою Zustand

Щоб краще організувати клієнтський стан (вибір адрес на карті, статус замовлення), Zustand підходить ідеально.

Створіть первісний стор поїздки `src/stores/useRideStore.ts`:
```typescript
// src/stores/useRideStore.ts
import { create } from "zustand";

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface RideState {
  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  rideStatus: "selecting" | "searching" | "accepted" | "in_progress" | "completed";
  
  // Дієслова для зміни стану
  setPickup: (location: Location) => void;
  setDropoff: (location: Location) => void;
  setRideStatus: (status: RideState["rideStatus"]) => void;
  resetRide: () => void;
}

export const useRideStore = create<RideState>((set) => ({
  pickupLocation: null,
  dropoffLocation: null,
  rideStatus: "selecting",

  setPickup: (location) => set({ pickupLocation: location }),
  setDropoff: (location) => set({ dropoffLocation: location }),
  setRideStatus: (status) => set({ rideStatus: status }),
  resetRide: () => set({
    pickupLocation: null,
    dropoffLocation: null,
    rideStatus: "selecting"
  }),
}));
```

## Резюме
Ви успішно заклали фундамент архітектури:
- **Axios (`apiClient`)** автоматично знаходить і прокидає JWT-токен Clerk-а до нашого бекенду Django.
- **TanStack Query** контролюватиме запити (як-от історія поїздок, доступні тарифи).
- **Zustand (`useRideStore`)** безпроблемно ділитиметься станом точок на карті та статусом поїздки між будь-якими компонентами.

Можемо переходити до інтеграції самої карти чи перших запитів до бекенду!
