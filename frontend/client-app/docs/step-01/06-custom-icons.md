# Інструкція 6: Кастомні іконки проекту

У цьому гайді описано, як реалізовані кастомні SVG-іконки для цього проекту та як їх використовувати у компонентах.

---

## Структура

Всі іконки знаходяться у папці:
```
src/components/icons/
```

**Файли:**
- `types.ts` — спільний тип `IconProps`
- `<ІконкаНазва>.tsx` — окремий компонент для кожної іконки
- `index.ts` — barrel-файл (реекспортує всі іконки)

---

## Кроки для реалізації

### Крок 1: Встановлення react-native-svg
```bash
npx expo install react-native-svg
```

### Крок 2: Спільний тип іконки (`types.ts`)
```tsx
export interface IconProps {
  size?: number;
  color?: string;
}
```

### Крок 3: Створення компонента іконки
Кожна іконка — окремий TSX-файл. Назва: `<Ім'яІконки>Icon.tsx`.

```tsx
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { IconProps } from './types';

export const ArrowLeftIcon: React.FC<IconProps> = ({ size = 24, color = '#2C293D' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12H3M3 12L8 17M3 12L8 7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
```

> **Важливо:** у пропсах завжди задавайте дефолтні значення `size` та `color`.

### Крок 4: Barrel-файл (`index.ts`)
Додайте реекспорт нової іконки в `index.ts`:
```ts
export { ArrowLeftIcon } from './ArrowLeftIcon';
```

---

## Список доступних іконок

| Компонент | Опис | Дефолтний колір |
|---|---|---|
| `AddPlusIcon` | Плюс / додати | `#2C293D` |
| `ArrowLeftIcon` | Стрілка вліво | `#2C293D` |
| `ArrowDownIcon` | Стрілка вниз | `#2C293D` |
| `ChevronRightIcon` | Шеврон вправо | `#2C293D` |
| `CloseIcon` | Закрити (×) | `#2C293D` |
| `CloseMDIcon` | Закрити червоний | `#D32F2F` |
| `CheckBigIcon` | Галочка | `#2C293D` |
| `SwapIcon` | Поміняти місцями | `#2C293D` |
| `RotateRightIcon` | Оновити / повторити | `#2C293D` |
| `BellIcon` | Дзвоник (сповіщення) | `#2C293D` |
| `SearchIcon` | Пошук | `#2C293D` |
| `MenuHamburgerIcon` | Меню-гамбургер | `#2C293D` |
| `EyeShowIcon` | Показати пароль | `#2C293D` |
| `EyeHideIcon` | Сховати пароль | `#2C293D` |
| `StarIcon` | Зірка (рейтинг) | `#FFA726` |
| `LocationIcon` | Локація (стрілка) | `#2C293D` |
| `LocationTickIcon` | Точка з галочкою | `#7700F6` |
| `MapPinIcon` | Пін на карті | `#2C293D` |
| `UserIcon` | Профіль користувача | `#2C293D` |
| `UserEditIcon` | Редагування профілю | `#2C293D` |
| `PeopleIcon` | Пасажири/Люди | `#2C293D` |
| `CarAutoIcon` | Автомобіль | `#2C293D` |
| `DrivingIcon` | Авто (заповнена) | `#2C293D` |
| `CarAlertIcon` | Авто з сигналом | `#2C293D` |
| `CallIcon` | Дзвінок (заповнена) | `#2C293D` |
| `MessageIcon` | Повідомлення | `#2C293D` |
| `PhoneIcon` | Телефон з сигналом | `#2C293D` |
| `CardIcon` | Платіжна картка | `#2C293D` |
| `CardsIcon` | Стопка карток | `#2C293D` |
| `WalletIcon` | Гаманець | `#2C293D` |
| `HomeIcon` | Будинок (проста) | `#2C293D` |
| `TabBarHomeIcon` | Будинок (для таббару) | `#2C293D` |
| `WorkIcon` | Робота (портфель) | `#2C293D` |
| `BriefcaseIcon` | Портфель детальний | `#2C293D` |
| `EmailIcon` | Пошта | `#2C293D` |
| `CalendarIcon` | Календар / Дата нар. | `#2C293D` |
| `GlobeIcon` | Глобус / Мова | `#2C293D` |
| `GenderIcon` | Стать | `#2C293D` |
| `TimerIcon` | Таймер/Пісочний год. | `#2C293D` |
| `HeartIcon` | Серце / Обране | `#2C293D` |
| `LockIcon` | Замок / Пароль | `#2C293D` |
| `DeleteIcon` | Видалити (кошик) | `#2C293D` |
| `ExitIcon` | Вийти | `#D32F2F` |
| `ShieldIcon` | Щит / Безпека | `#2C293D` |
| `HeadsetIcon` | Гарнітура / Підтримка | `#2C293D` |
| `HistoryIcon` | Історія поїздок | `#2C293D` |
| `VerifyIcon` | Верифікація | `#7700F6` |
| `CategoryLocationIcon` | Категорія: Місце | `#2C293D` |
| `CategoryOfficeIcon` | Категорія: Офіс | `#2C293D` |
| `CategoryRestaurantIcon` | Категорія: Ресторан | `#2C293D` |
| `CategoryShoppingIcon` | Категорія: Магазин | `#2C293D` |
| `CategoryTransportIcon` | Категорія: Транспорт | `#2C293D` |
| `FacebookIcon` | Facebook | брендовий |
| `TelegramIcon` | Telegram | брендовий |

---

## Використання у компонентах

### Базовий приклад
```tsx
import { ArrowLeftIcon, EyeShowIcon, VerifyIcon } from '@/src/components/icons';

// Дефолтний розмір та колір
<ArrowLeftIcon />

// Змінити розмір
<ArrowLeftIcon size={32} />

// Змінити колір
<ArrowLeftIcon color="#7700F6" />

// Обидва пропси
<EyeShowIcon size={20} color="#888" />

// Брендовий колір за замовчуванням (не потребує color)
<VerifyIcon />

// Змінити колір верифікації
<VerifyIcon color="#00C853" />
```

### Реальний приклад — кнопка "Назад"
```tsx
import { TouchableOpacity } from 'react-native';
import { ArrowLeftIcon } from '@/src/components/icons';

export const BackButton = ({ onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <ArrowLeftIcon size={24} color="#2C293D" />
  </TouchableOpacity>
);
```

### Реальний приклад — поле пароля з ToggleVisibility
```tsx
import { useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { EyeShowIcon, EyeHideIcon } from '@/src/components/icons';

export const PasswordInput = () => {
  const [secure, setSecure] = useState(true);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TextInput secureTextEntry={secure} style={{ flex: 1 }} />
      <TouchableOpacity onPress={() => setSecure(prev => !prev)}>
        {secure
          ? <EyeHideIcon size={20} color="#888" />
          : <EyeShowIcon size={20} color="#888" />
        }
      </TouchableOpacity>
    </View>
  );
};
```

---

## Додавання нової іконки

1. Скопіюйте SVG-розмітку з файлу в `docs/icons/`.
2. Створіть файл `src/components/icons/<НазваIcon>.tsx`.
3. Замініть атрибути `stroke` / `fill` на `{color}` та `width`/`height` на `{size}`.
4. Додайте реекспорт в `index.ts`.

---

## Результат

- ✅ Встановлено `react-native-svg`
- ✅ Створено 54 кастомні іконки як React-компоненти
- ✅ Кожна іконка підтримує `size` та `color` пропси з дефолтними значеннями
- ✅ Barrel-файл `index.ts` для зручного імпорту



```tsx
import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

const CustomCheckIcon = (props: SvgProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M20 6L9 17L4 12"
      stroke={props.color || "black"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default CustomCheckIcon;
```

---

## Підхід 2: Власний іконковий шрифт (IcoMoon)

Цей метод ідеально підходить, якщо у вас багато іконок, і ви хочете використовувати їх так само легко, як `Ionicons`.

### Крок 1: Підготовка файлів
1. Завантажте свій набір на [IcoMoon.io](https://icomoon.io/app).
2. Експортуйте проект і візьміть два файли: `selection.json` та `icomoon.ttf`.
3. Помістіть їх у проект:
   - Шрифт: `assets/fonts/icomoon.ttf`
   - Конфіг: `src/constants/icomoon-selection.json`

### Крок 2: Створення набору іконок
Створіть файл `src/components/CustomIcon.tsx`:

```tsx
import { createIconSetFromIcoMoon } from "@expo/vector-icons";
import Selection from "../constants/icomoon-selection.json";

// Реєструємо наш шрифт
const CustomIcon = createIconSetFromIcoMoon(
  Selection,
  "IcoMoon",
  "icomoon.ttf"
);

export default CustomIcon;
```

### Крок 3: Завантаження шрифту в додатку
У вашому кореневому файлі `app/_layout.tsx` потрібно завантажити шрифт перед використанням:

```tsx
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import CustomIcon from "@/src/components/CustomIcon";

export default function RootLayout() {
  const [loaded] = useFonts({
    IcoMoon: require("@/assets/fonts/icomoon.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return <Stack ... />;
}
```

---

## Використання у коді

Тепер ви можете використовувати іконки як звичайні компоненти:

```tsx
import CustomIcon from "@/src/components/CustomIcon";
import CustomCheckIcon from "@/src/components/icons/CustomCheck";

// Варіант 1 (Font)
<CustomIcon name="home" size={24} color="blue" />

// Варіант 2 (SVG)
<CustomCheckIcon color="green" width={30} height={30} />
```

---

## Результат

- Ви вмієте працювати з SVG безпосередньо в коді.
- Ви налаштували власну дизайн-систему на основі іконкового шрифту.
- Проект тепер має унікальний вигляд, незалежний від стандартних бібліотек.

---
