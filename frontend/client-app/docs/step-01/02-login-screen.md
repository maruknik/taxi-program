# Інструкція 2: Створення екрана Login (Телефон)

У цій інструкції ми реалізуємо головний екран авторизації, який дозволяє користувачеві вводити номер телефону, обирати код країни за допомогою кастомної модалки та входити за допомогою соціальних мереж.

---

## Крок 1: Підготовка даних країн (`src/utils/countries.ts`)

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
  .map((c: any) => ({ ...c, name: c.name }) as Country)
  .sort((a, b) => a.name.localeCompare(b.name));

export const DEFAULT_COUNTRY: Country =
  COUNTRIES.find((c) => c.name.includes("Ukraine")) || COUNTRIES[0];
```

---

## Крок 2: Компонент вибору країни (`src/components/CountryPickerModal.tsx`)

Цей компонент дозволяє користувачеві знайти та обрати код своєї країни зі списку.

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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.black} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.grayText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ваша країна?"
            placeholderTextColor={Colors.grayText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredCountries}
          keyExtractor={(item) => item.code + item.name}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.countryItem} onPress={() => { onSelect(item); onClose(); }}>
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

## Крок 3: Стилі модального вікна (`src/styles/countryPicker.styles.ts`)

```typescript
import { StyleSheet, Platform } from "react-native";
import { Colors } from "../constants/theme";

export const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: Colors.white, paddingTop: 10 },
  modalHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 20 },
  modalCloseButton: { width: 40, height: 40, backgroundColor: Colors.lightGray, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.lightGray, marginHorizontal: 20, borderRadius: 8, paddingHorizontal: 16, height: 46, marginBottom: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: Colors.black },
  countryItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, marginHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  countryItemFlag: { fontSize: 24, marginRight: 16 },
  countryItemName: { fontSize: 16, color: Colors.black },
});
```

---

## Крок 4: Головний екран логіну (`app/(auth)/login.tsx`)

```tsx
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/src/styles/login.styles";
import { Colors } from "@/src/constants/theme";
import CountryPickerModal from "@/src/components/CountryPickerModal";
import { DEFAULT_COUNTRY } from "@/src/utils/countries";

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCountryModalVisible, setCountryModalVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const router = useRouter();

  const isActive = phoneNumber.length >= 7;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
        <View style={styles.content}>
          <Text style={styles.title}>Номер мобільного телефону</Text>

          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.countryPicker} onPress={() => setCountryModalVisible(true)}>
              <Text style={styles.flag}>{selectedCountry.flag}</Text>
              <Ionicons name="caret-down" size={14} color={Colors.black} />
            </TouchableOpacity>

            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>{selectedCountry.code}</Text>
              <TextInput
                style={styles.input}
                placeholder="Номер телефону"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={9}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isActive ? styles.primaryButtonActive : styles.primaryButtonInactive]}
            disabled={!isActive}
            onPress={() => router.push("/(auth)/verify")}
          >
            <Text style={isActive ? styles.primaryButtonTextActive : styles.primaryButtonTextInactive}>Увійти</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} /><Text style={styles.dividerText}>або</Text><View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/(auth)/login-email")}>
            <Ionicons name="at-circle-outline" size={22} color={Colors.black} style={styles.socialIcon} />
            <Text style={styles.secondaryButtonText}>Продовжити з електронною поштою</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Продовжуючи, ви приймаєте Умови користування та ознайомлені з Політикою конфіденційності VARD.
          </Text>
        </View>
      </KeyboardAvoidingView>

      <CountryPickerModal
        visible={isCountryModalVisible}
        onSelect={(country) => setSelectedCountry(country)}
        onClose={() => setCountryModalVisible(false)}
      />
    </View>
  );
}
```

---

## Крок 5: Стилі екрана (`src/styles/login.styles.ts`)

```typescript
import { StyleSheet } from "react-native";
import { Colors } from "../constants/theme";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  keyboardAvoid: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 30 },
  inputRow: { flexDirection: "row", marginBottom: 20 },
  countryPicker: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.lightGray, padding: 12, borderRadius: 10, marginRight: 10 },
  phoneInputContainer: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: Colors.lightGray, padding: 12, borderRadius: 10 },
  countryCode: { marginRight: 10, fontSize: 16 },
  input: { flex: 1, fontSize: 16 },
  primaryButton: { padding: 16, borderRadius: 12, alignItems: "center", marginTop: 10 },
  primaryButtonActive: { backgroundColor: Colors.primary },
  primaryButtonInactive: { backgroundColor: Colors.mediumGray },
  primaryButtonTextActive: { color: Colors.white, fontWeight: "600" },
  primaryButtonTextInactive: { color: Colors.grayText },
  dividerContainer: { flexDirection: "row", alignItems: "center", marginVertical: 30 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.borderLight },
  dividerText: { marginHorizontal: 10, color: Colors.grayText, fontSize: 14 },
  secondaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.borderLight, marginBottom: 12 },
  secondaryButtonText: { fontWeight: "500", marginLeft: 10 },
  footer: { padding: 20, alignItems: "center" },
  footerText: { textAlign: "center", color: Colors.grayText, fontSize: 12, lineHeight: 18 }
});
```

---

## Результат

- Реалізовано екран входу з валідацією номера.
- Створено модульну систему вибору країни зі списку.
- Впроваджено KeyboardAvoidingView для коректної роботи з клавіатурою.

---
