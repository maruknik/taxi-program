# Гайд з розробки екранів аутентифікації (Client App)

Цей посібник детально описує процес створення сучасного інтерфейсу аутентифікації для таксі-сервісу. Ми розглянемо архітектурні рішення, типізацію та реалізацію складних UI-елементів.

---

## 1. Централізація стилів та тем

Першим кроком є винесення всіх констант кольорів в окремий файл. Це дозволяє легко змінювати брендинг всього додатка з одного місця.

### `src/constants/theme.ts`
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

## 2. Робота з даними країн

Для вибору телефонного коду ми використовуємо динамічний список країн, отриманий за допомогою бібліотеки `country-codes-list`.

### `src/utils/countries.ts`
```typescript
import { customArray } from "country-codes-list";

export interface Country {
  name: string;
  flag: string;
  code: string;
}

const rawCountries = customArray({
  name: "{countryNameEn}",
  localName: "{countryNameLocal}",
  flag: "{flag}",
  code: "+{countryCallingCode}",
});

export const COUNTRIES: Country[] = rawCountries
  .map((c: any) => {
    const local = c.localName ? c.localName.split(",")[0] : "";
    const displayName =
      local && local !== c.name ? `${c.name} (${local})` : c.name;
    return { ...c, name: displayName } as Country;
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export const DEFAULT_COUNTRY: Country =
  COUNTRIES.find((c) => c.name.includes("Ukraine")) || COUNTRIES[0];
```

---

## 3. Модальне вікно вибору країни

Компонент, який дозволяє користувачеві знайти та обрати свою країну зі списку.

### `src/components/CountryPickerModal.tsx`
```tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/src/constants/theme";
import { styles } from "@/src/styles/countryPicker.styles";
import { COUNTRIES, Country } from "@/src/utils/countries";

export default function CountryPickerModal({ visible, onClose, onSelect }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.code.includes(searchQuery)
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.grayText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ваша країна?"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredCountries}
          keyExtractor={(item) => item.code + item.name}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.countryItem} onPress={() => onSelect(item)}>
              <Text style={styles.countryItemFlag}>{item.flag}</Text>
              <Text style={styles.countryItemName}>{item.name} ({item.code})</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}
```

---

## 4. Відновлення паролю (Complex States)

Модальне вікно відновлення паролю демонструє роботу з декількома кроками (Step-based UI) в межах одного компонента.

### `src/components/ForgotPasswordModal.tsx`
```tsx
import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles/forgotPassword.styles";
import { Colors } from "../constants/theme";

const ForgotPasswordModal = ({ visible, onClose }) => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"request" | "success">("request");
  
  const isEmailError = email.includes(";") || (email.length > 5 && !email.includes("@"));

  const handleContinue = () => {
    if (email.length > 0 && !isEmailError) setStep("success");
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.content}>
          <View style={styles.topContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.black} />
            </TouchableOpacity>

            {step === "request" ? (
              <>
                <Text style={styles.title}>Не пам’ятаєш пароль?</Text>
                <TextInput
                  style={[styles.inputContainer, isEmailError && styles.inputError]}
                  placeholder="name@email.com"
                  value={email}
                  onChangeText={setEmail}
                />
              </>
            ) : (
              <>
                <Image source={require("@/assets/images/check_email.png")} style={styles.successImage} />
                <Text style={styles.title}>Перевір електронну пошту</Text>
                <Text>{email}</Text>
              </>
            )}
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={step === "request" ? handleContinue : onClose}>
            <Text>{step === "request" ? "Продовжити" : "Добре"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ForgotPasswordModal;
```

---

## 5. Позиціонування кнопок внизу (Flexbox)

На екранах входу через email ми використовуємо `justifyContent: 'space-between'` та обгортку `topContent` з `flex: 1`, щоб притиснути основну кнопку до нижньої частини екрана.

### Приклад структури `login-email.tsx`:
```tsx
<View style={styles.content}>
  <View style={styles.topContent}>
    {/* Заголовок та поля вводу */}
  </View>
  
  <TouchableOpacity style={styles.primaryButton}>
    <Text>Продовжити</Text>
  </TouchableOpacity>
</View>
```

### Відповідні стилі:
```typescript
content: {
  flex: 1,
  paddingHorizontal: 20,
  justifyContent: "space-between", // Розподіляє простір між topContent та кнопкою
},
topContent: {
  flex: 1, // Займає весь доступний простір, виштовхуючи кнопку вниз
},
```

---

## 6. Ключові поради:
1. **Видалення SafeAreaView**: Ми видалили `SafeAreaView` з окремих сторінок, оскільки він вже обгорнутий у кореневому `app/_layout.tsx`. Це запобігає зайвим відступам.
2. **KeyboardAvoidingView**: Завжди використовуйте його для форм вводу, щоб клавіатура не перекривала поля.
3. **Модульні стилі**: Створіть окремий файл стилів для кожного великого компонента або екрана (наприклад, `loginEmail.styles.ts`), щоб уникнути хаосу в коді компонента.
