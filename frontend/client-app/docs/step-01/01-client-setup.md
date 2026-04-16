# Інструкція 1: Налаштування клієнтського додатка

Ця інструкція проведе вас через процес ініціалізації проекту Expo, налаштування глобальної теми та створення базової структури навігації.

---

## Крок 1: Ініціалізація та структура

```bash
npx create-expo-app@latest client-app
cd client-app
```

### Структура папок та файлів:
```text
client-app/
├── app/                  # Файлова маршрутизація
│   ├── _layout.tsx       # Кореневий лейаут
│   └── index.tsx         # Точка входу (редірект)
├── src/
│   ├── constants/
│   │   └── theme.ts      # Глобальні кольори
│   ├── components/       # UI компоненти
│   ├── styles/           # Стилі екранів
│   └── utils/            # Допоміжні функції
└── assets/               # Картинки та шрифти
```

---

## Крок 2: Глобальна тема (`src/constants/theme.ts`)

Централізоване керування кольорами додатка.

```typescript
export const Colors = {
  white: "#fff",
  black: "#000",
  lightGray: "#F0F0F0",
  mediumGray: "#EAEAEA",
  darkGray: "#333",
  veryDarkGray: "#2C2C2C",
  grayText: "#A1A1A1",
  borderLight: "#D1D1D1",
  primary: "#6B38FB",
  error: "#E53E3E",
  googleRed: "#DB4437",
};
```

---

## Крок 3: Кореневий Лейаут (`app/_layout.tsx`)

Налаштування безпечних зон та стеку навігації.

```tsx
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaView>
  );
}
```

---

## Крок 4: Точка входу (`app/index.tsx`)

Автоматичний редірект користувача на екран логіну.

```tsx
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
```

---

## Результат

- Проект налаштовано з використанням TypeScript та Expo Router.
- Впроваджено систему констант для кольорів.
- Налаштовано SafeAreaView для коректного відображення на всіх пристроях.
- Створено початковий редірект на потік авторизації.

---
