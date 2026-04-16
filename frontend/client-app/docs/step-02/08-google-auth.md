# Крок 2.8: Реалізація входу через Google (OAuth)

У цьому документі описується додавання кнопки **"Увійти за допомогою Google"** (яка відображена на дизайні головного екрану аутентифікації) за допомогою Clerk OAuth в Expo.

---

## 1. Підготовка (expo-web-browser)

Clerk використовує пакет `expo-web-browser` для створення безпечного in-app браузера (Web View), у якому відкривається сторінка логіну Google.

Переконайтесь, що цей пакет вже встановлений у проекті:
```bash
npm install expo-web-browser
```

Також Clerk потребує, щоб ви викликали метод розгортання сесії поза межами усіх компонентів у файлі (зазвичай відразу після імпортів).

---

## 2. Хук Warm-Up для браузера

Для кращого користувацького досвіду (особливо на Android) рекомендується створити хук "прогріву" браузера. Створіть файл `src/hooks/useWarmUpBrowser.ts`:

```tsx
// src/hooks/useWarmUpBrowser.ts
import React from "react";
import * as WebBrowser from "expo-web-browser";

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};
```

---

## 3. Створення універсального хука useSSO

Для того, щоб не дублювати логіку `useOAuth`, `useWarmUpBrowser` та `WebBrowser` на кожному екрані, де є соціальний вхід (Google, Apple), ми створимо єдиний абстрактний хук.

Створіть файл `src/hooks/useSSO.ts`:

```tsx
import { useOAuth } from "@clerk/expo";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Alert } from "react-native";
import * as Linking from "expo-linking";
import { useWarmUpBrowser } from "./useWarmUpBrowser";

// Обов'язково для завершення сесії аутентифікації при редиректі назад у додаток
WebBrowser.maybeCompleteAuthSession();

export const useSSO = (strategy: "oauth_google" | "oauth_apple") => {
  useWarmUpBrowser();
  const router = useRouter();
  const { startOAuthFlow } = useOAuth({ strategy });

  const startSSOFlow = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/(auth)/loader"),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/(app)/main");
      }
    } catch (err: any) {
      console.error(`OAuth (${strategy}) error`, err);
      if (err.message !== "Session canceled by user") {
        Alert.alert("Помилка", err.message || "Помилка авторизації");
      }
    }
  }, [startOAuthFlow, router, strategy]);

  return { startSSOFlow };
};
```

---

## 4. Створення екрану-затички для Redirect (Unmatched Route Fix)

З використанням Expo Router, браузер після авторизації повертає користувача за deep link-ом. Щоб уникнути помилки "Page could not be found" (Unmatched Route), ми створимо спеціальний екран за адресою `app/(auth)/loader.tsx`, який буде приймати цей запит.

Створіть файл `app/(auth)/loader.tsx`:

```tsx
import { ActivityIndicator, View } from "react-native";

export default function LoaderScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <ActivityIndicator size="large" color={"#000000"} />
    </View>
  );
}
```

---

## 5. Код компонента з Google-авторизацією

Оскільки у вас вже є файл `app/(auth)/login.tsx` з готовим UI, ми просто модифікуємо його, використавши наш новий хук.

Ось ключові зміни, які потрібно зробити у файлі `app/(auth)/login.tsx`:

```tsx
// 1. Додайте імпорт нашого кастомного хука:
import { useSSO } from "@/src/hooks/useSSO";

export default function LoginScreen() {
  
  // ... існуючий код (const [phoneNumber...])
  
  // 2. Ініціалізуйте хук з необхідною стратегією та отримайте обробник:
  const { startSSOFlow: handleGoogleSignIn } = useSSO("oauth_google");

  // ... інший код (handleNext тощо)

  return (
    <View style={styles.container}>
      {/* ... попередній UI ... */}
      
      {/* 6. Додайте обробник onPress до наявної кнопки Google */}
      <TouchableOpacity 
        style={styles.secondaryButton} 
        activeOpacity={0.7}
        onPress={handleGoogleSignIn} // <-- Додано цей рядок
      >
        <GoogleIcon size={20} style={styles.socialIcon} />
        <Text style={styles.secondaryButtonText}>
          Увійти за допомогою Google
        </Text>
      </TouchableOpacity>

      {/* ... інший UI ... */}
    </View>
  );
}
```

---

## 6. Налаштування в Clerk Dashboard

Для того щоб логін через Google запрацював, переконайтеся, що ви увімкнули його у вашому Clerk проекті.

1. Зайдіть в панель керування [Clerk Dashboard](https://dashboard.clerk.com/).
2. Оберіть ваш додаток.
3. У лівому меню виберіть **Configure** -> **SSO Connections** (або Social connections).
4. Натисніть **Add connection** і оберіть **Google**.
5. На етапі розробки (Development) Clerk автоматично підтягне "Shared credentials". Цього достатньо, щоб код запрацював в Expo Go.
6. *Для продакшну вам буде потрібно отримати власні "Client ID" та "Client Secret" в Google Cloud Console та внести їх в цей же розділ.*

---

## 7. Особливості використання OAuth

- **Unified Flow:** Використання хука `useOAuth` охоплює як "Вхід" (Sign in), так і "Реєстрацію" (Sign up). Clerk автоматично створить користувача під капотом, якщо акаунта Google з такою поштою ще не існує в базі. Більше не потрібно руками перевіряти це.
- **Відловлювання помилок:** Важливо приглушувати або ігнорувати обробку помилки `"Session canceled by user"` в блоці `catch` виклику `startOAuthFlow`, оскільки користувач має право будь-якої миті закрити системне вікно браузера, і це не є технічною помилкою нашого коду.
