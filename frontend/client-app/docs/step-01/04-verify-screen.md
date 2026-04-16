# Інструкція 4: Створення екрана Verify (SMS)

Ця інструкція проведе вас через створення екрана підтвердження входу за допомогою SMS-коду. Ви дізнаєтесь, як реалізувати візуальні блоки для вводу коду за допомогою прихованого `TextInput`.

---

## Крок 1: Екран підтвердження SMS (`app/(auth)/verify.tsx`)

```tsx
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/src/styles/verify.styles";
import { Colors } from "@/src/constants/theme";

export default function VerifyScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const inputRef = useRef<TextInput>(null);

  const isError = code === "1148"; // Симуляція помилки для макету

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.black} />
          </TouchableOpacity>

          <Text style={styles.title}>Раді бачити вас!</Text>
          <Text style={styles.subtitle}>Для входу введіть 4-значний код з SMS на номер +380674510218.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>Інший номер телефону?</Text>
          </TouchableOpacity>

          <View style={styles.codeContainer}>
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={setCode}
              maxLength={4}
              keyboardType="number-pad"
              style={styles.hiddenInput}
              autoFocus={true}
            />

            <View style={styles.boxesContainer} pointerEvents="none">
              {[0, 1, 2, 3].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.codeBox,
                    isError && styles.codeBoxError,
                    code.length === index && !isError && styles.codeBoxActive,
                  ]}
                >
                  <Text style={styles.codeText}>{code[index] || ""}</Text>
                </View>
              ))}
            </View>
          </View>

          {isError && <Text style={styles.errorText}>Неправильний код</Text>}

          <TouchableOpacity style={styles.pillButton} activeOpacity={0.7}>
            <Text style={styles.pillButtonText}>Отримати код повторно</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pillButton} activeOpacity={0.7} onPress={() => router.push("/(auth)/login-email")}>
            <Text style={styles.pillButtonText}>Увійти через електронну пошту</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
```

---

## Крок 2: Стилі екрана (`src/styles/verify.styles.ts`)

```typescript
import { StyleSheet } from "react-native";
import { Colors } from "../constants/theme";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  keyboardAvoid: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  backButton: { width: 40, height: 40, backgroundColor: Colors.lightGray, borderRadius: 8, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "700", color: Colors.black, marginBottom: 10 },
  subtitle: { fontSize: 14, color: Colors.darkGray, lineHeight: 20, marginBottom: 10 },
  linkText: { fontSize: 14, color: Colors.primary, fontWeight: "500", marginBottom: 30 },
  codeContainer: { marginBottom: 20, position: "relative", height: 60, justifyContent: "center" },
  hiddenInput: { position: "absolute", width: "100%", height: "100%", opacity: 0, zIndex: 1 },
  boxesContainer: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  codeBox: { width: "22%", height: 60, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 8, justifyContent: "center", alignItems: "center", backgroundColor: Colors.white },
  codeBoxActive: { borderColor: Colors.primary },
  codeBoxError: { borderColor: Colors.error },
  codeText: { fontSize: 24, fontWeight: "600", color: Colors.black },
  errorText: { color: Colors.error, fontSize: 12, marginBottom: 20 },
  pillButton: { backgroundColor: Colors.lightGray, alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginBottom: 12 },
  pillButtonText: { fontSize: 14, color: Colors.black, fontWeight: "500" },
});
```

---

## Результат

- Реалізовано візуально привабливе поле для вводу коду (OTP input).
- Впроваджено логіку переключення станів (фокус, помилка).
- Забезпечено зручну навігацію назад та переключення на вхід по Email.

---
