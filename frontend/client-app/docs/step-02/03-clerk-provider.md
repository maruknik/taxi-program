# Крок 2.3: Встановлення Clerk SDK та налаштування провайдера

У цьому документі ми встановимо Clerk SDK для Expo, створимо `tokenCache` для безпечного зберігання сесій та обгорнемо весь додаток у `ClerkProvider`.

---

## Частина 1: Встановлення пакетів

Виконайте наступні команди у папці `client-app/`:

```bash
# 1. Основний Clerk SDK для Expo/React Native (версія 3.x — Future API)
npx expo install @clerk/expo

# 2. Secure Storage для збереження токенів (обов'язково!)
npx expo install expo-secure-store
```

> [!IMPORTANT]
> `expo-secure-store` — обов'язковий. Він забезпечує безпечне зберігання Clerk-токенів у нативному сховищі телефону (Keychain на iOS, Keystore на Android). Без нього сесія не збережеться після перезапуску додатку.

Актуальні версії залежностей у `package.json`:

```json
{
  "dependencies": {
    "@clerk/expo": "^3.1.6",
    "expo-secure-store": "~15.0.8"
  }
}
```

---

## Частина 2: Створення `tokenCache`

Створіть файл `src/utils/cache.ts`. Він реалізує інтерфейс `TokenCache`, який Clerk використовує для збереження токенів між сесіями:

```typescript
// src/utils/cache.ts
import * as SecureStore from 'expo-secure-store';

export const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐`);
      } else {
        console.log('No values stored under key: ' + key);
      }
      return item;
    } catch (error) {
      console.error('SecureStore get item error: ', error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};
```

> [!NOTE]
> `getToken` та `saveToken` — це два єдині методи, які Clerk вимагає від `tokenCache`. При помилці читання ключ автоматично видаляється, щоб уникнути пошкодженого стану.

---

## Частина 3: Налаштування кореневого Layout

Замініть вміст файлу `app/_layout.tsx`. Ми обгортаємо весь додаток у `ClerkProvider` та передаємо `tokenCache`:

```tsx
// app/_layout.tsx
import { ClerkLoaded, ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@/src/utils/cache";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY — " +
      "переконайтеся що файл client-app/.env.local заповнений",
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {/*
        ClerkLoaded — рендерить дочірні елементи тільки після того,
        як Clerk завантажив стан сесії. Це запобігає "мерехтінню" UI.
      */}
      <ClerkLoaded>
        <SafeAreaView style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaView>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
```

> [!NOTE]
> **`ClerkLoaded`** — важливий компонент: він не показує жодного UI до тих пір, доки Clerk не завантажить поточний стан сесії. Це запобігає миттєвому показу екрана входу залогованому користувачу.

> [!TIP]
> Файл з ключами називається `.env.local` (а не `.env`), оскільки Expo автоматично завантажує обидва формати, але `.env.local` не потрапляє у git-репозиторій.

---

## Частина 4: Налаштування навігації на основі стану автентифікації

### `app/(auth)/_layout.tsx`

Якщо користувач вже залогований — він одразу перенаправляється на головний екран:

```tsx
// app/(auth)/_layout.tsx
import { Stack, Redirect } from "expo-router";
import { useAuth } from "@clerk/expo";

export default function AuthLayout() {
  const { isSignedIn } = useAuth();

  // Якщо користувач вже залогований — перенаправляємо на головний екран
  if (isSignedIn) {
    return <Redirect href="/(app)/main" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="login-email" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}
```

### `app/index.tsx`

Вхідна точка додатку вирішує куди перенаправити користувача:

```tsx
// app/index.tsx
import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";

export default function Index() {
  const { isSignedIn } = useAuth();

  // Залогований → головний екран, ні → екран входу
  return <Redirect href={isSignedIn ? "/(app)/main" : "/(auth)/login"} />;
}
```

> [!NOTE]
> Маршрут `/(app)/main` — це головний екран додатку (вкладки, карта тощо). Переконайтеся що цей маршрут існує у вашому проекті.

---

## Частина 5: Перевірка

Запустіть додаток:

```bash
# У папці client-app/
npx expo start --clear
```

Ви повинні побачити:

- ✅ Додаток запускається без помилок.
- ✅ Відкривається екран `login.tsx` (оскільки ви ще не залоговані).
- ✅ У консолі немає помилок `Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- ✅ У консолі з'являється попередження `Clerk has been loaded with development keys` — це нормально для dev-середовища.

> [!TIP]
> Якщо бачите помилку `Cannot find module '@clerk/expo'` — перезапустіть сервер: `npx expo start --clear`

---

## Результат цього кроку

- ✅ Встановлено `@clerk/expo` v3.x та `expo-secure-store` ~15.0.8.
- ✅ Створено `src/utils/cache.ts` — безпечне зберігання токенів.
- ✅ `ClerkProvider` з `tokenCache` обгортає весь додаток.
- ✅ Реалізовано автоматичну навігацію на основі стану авторизації.
- ✅ `/(auth)/_layout.tsx` захищає екрани входу від залогованих користувачів.

**Наступний крок →** [04-phone-auth.md](./04-phone-auth.md)
