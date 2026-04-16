# Інструкція 3: Створення екрана Login (Email)

Ця інструкція проведе вас через створення другого способу авторизації — за допомогою електронної пошти та пароля. Вона включає реалізацію модального вікна відновлення пароля та функціонал показу/приховання символів.

---

## Крок 1: Компонент "Забули пароль" (`src/components/ForgotPasswordModal.tsx`)

Цей компонент реалізує двоетапний процес відновлення доступу (запит email та підтвердження відправки).

```tsx
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles/forgotPassword.styles";
import { Colors } from "../constants/theme";

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
}) => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"request" | "success">("request");

  const isEmailError =
    email.includes(";") || (email.length > 5 && !email.includes("@"));

  const handleContinue = () => {
    if (email.length > 0 && !isEmailError) setStep("success");
  };

  const handleClose = () => {
    setStep("request");
    setEmail("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.content}>
            <View style={styles.topContent}>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>

              {step === "request" ? (
                <>
                  <Text style={styles.title}>Не пам’ятаєш пароль?</Text>
                  <Text style={styles.subtitle}>
                    Вкажіть свій email і ми відправимо тобі посилання на
                    скидування паролю
                  </Text>

                  <View style={[styles.inputContainer, isEmailError && styles.inputError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="name@email.com"
                      placeholderTextColor={Colors.grayText}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                      autoFocus
                    />
                  </View>
                  {isEmailError && (
                    <Text style={styles.errorText}>Електрона пошта введена не вірно</Text>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.successImageContainer}>
                    <Image
                      source={require("@/assets/images/check_email.png")}
                      style={styles.successImage}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.title}>Перевір електронну пошту</Text>
                  <Text style={styles.successDescription}>
                    Ми надіслали лист з інструкцією на адресу{"\n"}
                    <Text style={{ fontWeight: "600" }}>{email || "vard777@gmail.com"}</Text>
                  </Text>
                </>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                email.length > 0 && !isEmailError ? styles.primaryButtonActive : styles.primaryButtonInactive,
              ]}
              onPress={step === "request" ? handleContinue : handleClose}
              disabled={step === "request" && (email.length === 0 || isEmailError)}
            >
              <Text style={email.length > 0 && !isEmailError ? styles.primaryButtonTextActive : styles.primaryButtonTextInactive}>
                {step === "request" ? "Продовжити" : "Добре"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default ForgotPasswordModal;
```

---

## Крок 2: Стилі модального вікна (`src/styles/forgotPassword.styles.ts`)

```typescript
import { StyleSheet } from "react-native";
import { Colors } from "../constants/theme";

export const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: Colors.white },
  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 20, justifyContent: "space-between" },
  topContent: { flex: 1 },
  closeButton: { width: 40, height: 40, backgroundColor: Colors.lightGray, borderRadius: 8, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "700", color: Colors.black, marginBottom: 16 },
  subtitle: { fontSize: 16, color: Colors.darkGray, lineHeight: 22, marginBottom: 24 },
  inputContainer: { backgroundColor: Colors.lightGray, borderRadius: 8, height: 52, paddingHorizontal: 16, justifyContent: "center", borderWidth: 1, borderColor: "transparent" },
  inputError: { borderColor: Colors.error },
  input: { fontSize: 16, color: Colors.black },
  errorText: { color: Colors.error, fontSize: 12, marginTop: 8 },
  primaryButton: { height: 52, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  primaryButtonInactive: { backgroundColor: Colors.mediumGray },
  primaryButtonActive: { backgroundColor: Colors.primary },
  primaryButtonTextActive: { color: Colors.white, fontWeight: "600" },
  primaryButtonTextInactive: { color: Colors.grayText },
  successImageContainer: { width: "100%", height: 250, justifyContent: "center", alignItems: "center", marginBottom: 24, backgroundColor: Colors.lightGray, borderRadius: 12, overflow: "hidden" },
  successImage: { width: "100%", height: "100%" },
  successDescription: { fontSize: 15, color: Colors.black, lineHeight: 22, marginBottom: 16 },
});
```

---

## Крок 3: Екран логіну по Email (`app/(auth)/login-email.tsx`)

```tsx
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/src/styles/loginEmail.styles";
import { Colors } from "@/src/constants/theme";
import ForgotPasswordModal from "@/src/components/ForgotPasswordModal";

export default function LoginEmailScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isForgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const router = useRouter();

  const isActive = email.length > 0 && password.length > 0;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Вхід через Email</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.inputGroup}>
            <TextInput style={styles.input} placeholder="Електронна пошта" value={email} onChangeText={setEmail} autoCapitalize="none" />
          </View>

          <View style={[styles.inputGroup, styles.passwordContainer]}>
            <TextInput style={styles.input} placeholder="Пароль" value={password} onChangeText={setPassword} secureTextEntry={!passwordVisible} />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
              <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={20} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isActive ? styles.primaryButtonActive : styles.primaryButtonInactive]}
            disabled={!isActive}
            onPress={() => router.push("/(auth)/verify-email")}
          >
            <Text style={isActive ? styles.primaryButtonTextActive : styles.primaryButtonTextInactive}>Продовжити</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPassBtn} onPress={() => setForgotPasswordVisible(true)}>
            <Text style={styles.forgotPassText}>Не пам’ятаю пароль</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ForgotPasswordModal visible={isForgotPasswordVisible} onClose={() => setForgotPasswordVisible(false)} />
    </View>
  );
}
```

---

## результати

- Реалізовано повний потік авторизації через Email.
- Створено складний багатокроковий компонент `ForgotPasswordModal`.
- Налаштовано стилізацію для світлої теми з використанням дизайн-системи.

---
