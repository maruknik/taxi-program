# Інструкція 5: Підтвердження коду через Email (`verify-email.tsx`)

Ця інструкція проведе вас через створення екрана верифікації коду, надісланого на електронну пошту, що є фінальним етапом авторизації через email.

---

## Крок 1: Екран підтвердження Email (`app/(auth)/verify-email.tsx`)

```tsx
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { styles } from "@/src/styles/verifyEmail.styles";
import { Colors } from "@/src/constants/theme";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const inputRef = useRef<TextInput>(null);

  const email = "vard777@gmail.com"; 
  const isError = code === "2346"; 

  const renderCodeBoxes = () => {
    return [0, 1, 2, 3].map((index) => {
      const isFocused = code.length === index || (code.length === 4 && index === 3);
      return (
        <View key={index} style={[styles.codeBox, (isError || isFocused) && styles.codeBoxError]}>
          <Text style={styles.codeText}>{code[index] || ""}</Text>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
        <View style={styles.content}>
          <View style={styles.topContent}>
            <Text style={styles.title}>Підтвердьте вхід</Text>
            <Text style={styles.subtitle}>Код підтвердження надіслано на {email}. Введіть його для завершення входу.</Text>

            <View style={styles.codeContainer}>
               <View style={styles.boxesContainer}>{renderCodeBoxes()}</View>
               <TextInput ref={inputRef} style={styles.hiddenInput} keyboardType="number-pad" maxLength={4} value={code} onChangeText={setCode} autoFocus />
            </View>

            {isError && <Text style={styles.errorText}>Неправильний код</Text>}
          </View>

          <View>
            <TouchableOpacity style={styles.pillButton} activeOpacity={0.7}><Text style={styles.pillButtonText}>Отримати код повторно</Text></TouchableOpacity>
            <TouchableOpacity style={styles.pillButton} onPress={() => router.back()} activeOpacity={0.7}><Text style={styles.pillButtonText}>Змінити електронну адресу</Text></TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
```

---

## Крок 2: Стилі екрана (`src/styles/verifyEmail.styles.ts`)

```typescript
import { StyleSheet } from "react-native";
import { Colors } from "../constants/theme";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  keyboardAvoid: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 20, justifyContent: "space-between" },
  topContent: { flex: 1 },
  title: { fontSize: 24, fontWeight: "700", color: Colors.black, marginBottom: 16 },
  subtitle: { fontSize: 15, color: Colors.black, lineHeight: 22, marginBottom: 20 },
  boxesContainer: { flexDirection: "row", justifyContent: "flex-start", gap: 12, marginBottom: 8 },
  codeBox: { width: 60, height: 60, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 8, justifyContent: "center", alignItems: "center", backgroundColor: Colors.white },
  codeBoxError: { borderColor: Colors.error },
  codeText: { fontSize: 24, color: Colors.black },
  errorText: { color: Colors.error, fontSize: 12, marginBottom: 20 },
  pillButton: { backgroundColor: Colors.lightGray, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 50, alignSelf: "flex-start", marginBottom: 16 },
  pillButtonText: { fontSize: 15, fontWeight: "500", color: Colors.black },
  codeContainer: { position: "relative", width: "100%" },
  hiddenInput: { position: "absolute", top: 0, left: 0, width: "100%", height: 60, opacity: 0, zIndex: 10 },
});
```

---

## Результат

- Реалізовано екран верифікації для потоку електронної пошти.
- Створено механізм візуальних блоків з автоматичним фокусом.
- Додано можливість зміни адреси та повторного отримання коду.

---
