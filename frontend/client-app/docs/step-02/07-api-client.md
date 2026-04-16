# Крок 2.7: Створення API-клієнта із JWT автентифікацією

У цьому документі ми створимо централізований `apiClient` — утиліту для всіх HTTP-запитів до Django-бекенду. Клієнт автоматично додаватиме JWT-токен Clerk у кожен запит.

---

## Як JWT-автентифікація працює в нашому проекті

```
React Native (client-app)              Django Backend
        │                                     │
        │  1. useAuth().getToken()            │
        │─────────────────────────────────────│
        │  ◄──── JWT токен від Clerk ─────────│
        │                                     │
        │  2. GET /api/users/me/              │
        │     Authorization: Bearer <JWT>     │
        │─────────────────────────────────────►│
        │                                     │  3. Верифікація JWT
        │                                     │     через Clerk API
        │                                     │
        │  ◄──── { id, email, role, ... } ────│
```

Django верифікує JWT за допомогою публічного ключа Clerk (без додаткових Round Trip до Clerk API — це відбувається локально).

---

## Частина 1: Утиліта `apiClient`

Створіть файл `src/utils/apiClient.ts` (вже є у проекті):

```typescript
// src/utils/apiClient.ts
import { useAuth } from "@clerk/expo";
import { useCallback } from "react";

/**
 * Базова URL адреса вашого Django-бекенду.
 * При локальній розробці: ваш комп'ютер у одній мережі з телефоном/емулятором.
 *
 * ВАЖЛИВО:
 * - Для Android-емулятора: 10.0.2.2 (замість localhost)
 * - Для фізичного пристрою: IP-адреса вашого комп'ютера (наприклад, 192.168.1.100)
 * - Для продакшн: https://api.yourapp.com
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:8000";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Хук для роботи з API-запитами.
 * Автоматично додає JWT-токен Clerk до кожного запиту.
 *
 * @example
 * const { get, post } = useApiClient();
 * const { data, error } = await get<UserProfile>("/api/users/me/");
 */
export function useApiClient() {
  const { getToken } = useAuth();

  /**
   * Виконати HTTP-запит до Django-бекенду
   */
  const request = useCallback(
    async <T = unknown>(
      endpoint: string,
      method: HttpMethod = "GET",
      body?: object
    ): Promise<ApiResponse<T>> => {
      try {
        // Отримуємо актуальний JWT-токен від Clerk
        // getToken() автоматично оновлює токен якщо він протермінований
        const token = await getToken();

        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };

        // Якщо є токен — додаємо авторизацію
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        // Обробка відповідей без тіла (204 No Content)
        if (response.status === 204) {
          return { data: null, error: null, status: 204 };
        }

        const json = await response.json();

        if (!response.ok) {
          // Django повертає помилки у різних форматах —
          // обробляємо найбільш поширені
          const errorMessage =
            json?.detail ||
            json?.message ||
            json?.error ||
            Object.values(json)?.[0] ||
            `HTTP ${response.status}`;

          return {
            data: null,
            error: String(errorMessage),
            status: response.status,
          };
        }

        return { data: json as T, error: null, status: response.status };
      } catch (networkError: any) {
        // Мережева помилка (сервер недоступний, немає інтернету)
        console.error("API request failed:", networkError);
        return {
          data: null,
          error: networkError?.message ?? "Помилка мережевого з'єднання",
          status: 0,
        };
      }
    },
    [getToken]
  );

  return {
    get: <T = unknown>(endpoint: string) =>
      request<T>(endpoint, "GET"),

    post: <T = unknown>(endpoint: string, body: object) =>
      request<T>(endpoint, "POST", body),

    patch: <T = unknown>(endpoint: string, body: object) =>
      request<T>(endpoint, "PATCH", body),

    put: <T = unknown>(endpoint: string, body: object) =>
      request<T>(endpoint, "PUT", body),

    delete: <T = unknown>(endpoint: string) =>
      request<T>(endpoint, "DELETE"),
  };
}
```

---

## Частина 2: TypeScript-типи для відповідей API

Створіть файл `src/types/api.types.ts` відповідно до serializers.py вашого бекенду:

```typescript
// src/types/api.types.ts

/**
 * Профіль поточного користувача.
 * Відповідає UserDetailSerializer у apps/users/serializers.py
 */
export interface UserProfile {
  id: string;          // UUID
  email: string;
  phone_number: string | null;
  first_name: string;
  last_name: string;
  full_name: string;   // property: first_name + last_name
  profile_image: string;
  role: "user" | "driver" | "admin";
  is_verified: boolean;
  is_active: boolean;
  created_at: string;  // ISO 8601
  updated_at: string;
  last_login: string | null;
  rides_count: number;
  total_spent: number;
  average_rating: number;
}

/**
 * Дані для оновлення профілю.
 * Відповідає UserUpdateSerializer
 */
export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_image?: string;
}
```

---

## Частина 3: Хук `useCurrentUser`

Створіть зручний хук для отримання профілю поточного користувача:

```typescript
// src/hooks/useCurrentUser.ts
import { useState, useEffect } from "react";
import { useApiClient } from "@/src/utils/apiClient";
import { UserProfile } from "@/src/types/api.types";

interface UseCurrentUserReturn {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Хук для отримання профілю поточного користувача з Django-бекенду.
 *
 * @example
 * const { user, isLoading, error } = useCurrentUser();
 * if (isLoading) return <ActivityIndicator />;
 * return <Text>{user?.full_name}</Text>;
 */
export function useCurrentUser(): UseCurrentUserReturn {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { get } = useApiClient();

  const fetchUser = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: apiError } = await get<UserProfile>("/api/users/me/");

    if (apiError) {
      setError(apiError);
    } else {
      setUser(data);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return { user, isLoading, error, refetch: fetchUser };
}
```

---

## Частина 4: Додання змінної в `.env.local`

Додайте URL бекенду до `client-app/.env.local`:

```bash
# client-app/.env.local
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ваш_ключ_тут

# URL до Django-бекенду
# Android емулятор:
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000
# iOS симулятор:
# EXPO_PUBLIC_API_URL=http://localhost:8000
# Фізичний пристрій (замініть на IP вашого комп'ютера у локальній мережі):
# EXPO_PUBLIC_API_URL=http://192.168.0.100:8000
```

> [!TIP]
> Щоб знайти IP вашого комп'ютера у локальній мережі (для тестування на фізичному пристрої): `ip a | grep 'inet ' | grep -v 127.0.0.1`

---

## Частина 5: Приклад використання

### Отримання профілю користувача

```tsx
// app/(app)/profile.tsx — приклад екрану профілю
import { View, Text, ActivityIndicator } from "react-native";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";

export default function ProfileScreen() {
  const { user, isLoading, error } = useCurrentUser();

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Text>Помилка: {error}</Text>;
  }

  return (
    <View>
      <Text>{user?.full_name}</Text>
      <Text>{user?.email}</Text>
      <Text>Роль: {user?.role}</Text>
    </View>
  );
}
```

### Оновлення профілю

```tsx
import { useApiClient } from "@/src/utils/apiClient";
import { UpdateProfilePayload } from "@/src/types/api.types";

function UpdateProfileButton() {
  const { patch } = useApiClient();

  const handleUpdate = async () => {
    const payload: UpdateProfilePayload = {
      first_name: "Іван",
      last_name: "Петренко",
      phone_number: "+380501234567",
    };

    const { data, error } = await patch("/api/users/update_profile/", payload);

    if (error) {
      console.error("Помилка оновлення:", error);
    } else {
      console.log("Профіль оновлено:", data);
    }
  };

  // ...
}
```

### Вихід з акаунту

```tsx
import { useAuth } from "@clerk/expo";

function LogoutButton() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    // AuthLayout автоматично перенаправить на /(auth)/login
    // бо useAuth().isSignedIn стане false
  };

  // ...
}
```

---

## Частина 6: Доступні API-endpoints

Ось повний список endpoints вашого бекенду для клієнтського додатку:

| Метод | Endpoint | Опис |
| :--- | :--- | :--- |
| `GET` | `/api/users/me/` | Профіль поточного користувача |
| `PATCH` | `/api/users/update_profile/` | Оновлення профілю |
| `POST` | `/api/users/fcm_token/` | Оновлення FCM-токену (пуш-сповіщення) |
| `GET` | `/api/users/ride_history/` | Історія поїздок |
| `DELETE` | `/api/users/delete_account/` | Видалення акаунту |

> [!NOTE]
> Всі endpoints вимагають заголовок `Authorization: Bearer <JWT>`.
> Єдиний публічний endpoint — `POST /api/users/webhooks/clerk/` (тільки для Clerk).

---

## Результат цього кроку

- ✅ Створено `useApiClient()` — централізований хук для HTTP-запитів.
- ✅ JWT-токен Clerk автоматично додається до кожного запиту.
- ✅ Реалізовано TypeScript-типи відповідно до Django-serializers.
- ✅ Створено `useCurrentUser()` — зручний хук для профілю.
- ✅ Наведено приклади для основних операцій: GET, PATCH, logout.

---

## Підсумок Кроку 2: Що реалізовано

| # | Файл | Статус |
| :--- | :--- | :--- |
| 1 | `client-app/.env.local` (EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) | ✅ |
| 2 | `src/utils/cache.ts` (tokenCache для SecureStore) | ✅ |
| 3 | `app/_layout.tsx` (ClerkProvider + ClerkLoaded) | ✅ |
| 4 | `app/index.tsx` (навігація за станом isSignedIn) | ✅ |
| 5 | `app/(auth)/_layout.tsx` (захист від залогованих) | ✅ |
| 6 | `app/(auth)/login.tsx` (SMS + signUpIfMissing) | ✅ |
| 7 | `app/(auth)/verify.tsx` (OTP + transfer для нових) | ✅ |
| 8 | `app/(auth)/login-email.tsx` (пароль + seamless sign-up) | ✅ |
| 9 | `app/(auth)/verify-email.tsx` (email OTP для sign_in/sign_up) | ✅ |
| 10 | `backend/.env` (CLERK_SECRET_KEY, CLERK_WEBHOOK_SECRET) | ✅ |
| 11 | ngrok + Webhook у Clerk Dashboard | ✅ |
| 12 | `src/utils/apiClient.ts` | ✅ |
| 13 | `src/types/api.types.ts` | ✅ |
| 14 | `src/hooks/useCurrentUser.ts` | ✅ |
