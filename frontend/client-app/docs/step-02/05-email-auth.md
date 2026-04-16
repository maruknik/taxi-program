# Крок 2.5: Реалізація входу за електронною поштою

У цьому документі ми підключимо реальну логіку Clerk до екранів `login-email.tsx` (email + пароль) та `verify-email.tsx` (підтвердження email одноразовим кодом). Використовується **Clerk 6 Future API** (`@clerk/expo` v3.x).

---

## Як працює Email Auth у Clerk 6

```
┌─ login-email.tsx ──────────────────────────────────┐
│ 1. Користувач вводить email + пароль                │
│ 2. signIn.password({ emailAddress, password })      │──► Clerk перевіряє пароль
└─────────────────────────────────────────────────────┘
                    │
          ┌─────────┴─────────────┐
          ▼                       ▼
   Пароль вірний           Помилка: form_identifier_not_found
   signIn.status = "complete"    (користувач не існує)
          │                       │
          ▼                       ▼
   signIn.finalize()        signUp.password() → sendEmailCode()
   setActive(session)             │
   → /(app)/main                  ▼
                          ┌─ verify-email.tsx ─────────┐
                          │  mode = "sign_up"           │
                          │  signUp.verifications       │
                          │    .verifyEmailCode({ code })│
                          └─────────────────────────────┘
```

### Два сценарії:
1. **Існуючий користувач** → `signIn.password()` → `signIn.finalize()` → одразу до `/(app)/main`
2. **Новий користувач** → `signIn.password()` ❌ → `signUp.password()` → `verify-email.tsx`

### Ключова відмінність від Legacy API

| Legacy API (застарілий) | Future API (Clerk 6, поточний) |
| :--- | :--- |
| `signIn.create({ identifier, password })` | `signIn.password({ emailAddress, password })` |
| `catch(err) { err.errors[0].code }` | `const { error } = await signIn.password(...)` |
| `signUp.create({ emailAddress, password })` | `signUp.password({ emailAddress, password })` |
| `signUp.prepareEmailAddressVerification()` | `signUp.verifications.sendEmailCode()` |
| `signUp.attemptEmailAddressVerification()` | `signUp.verifications.verifyEmailCode()` |
| `signIn.attemptFirstFactor()` | `signIn.emailCode.verifyCode()` |
| `setActive({ session: result.createdSessionId })` | `signIn/signUp.finalize()` → автоматично |

---

## Частина 1: `app/(auth)/login-email.tsx`

```tsx
// app/(auth)/login-email.tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { styles } from "@/src/styles/loginEmail.styles";
import { Colors } from "@/src/constants/theme";
import ForgotPasswordModal from "@/src/components/ForgotPasswordModal";
import { CloseMDIcon, EyeShowIcon, EyeHideIcon } from "@/src/components/icons";
import { useSignIn, useSignUp, useClerk } from "@clerk/expo";

export default function LoginEmailScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isForgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { setActive } = useClerk();

  const isActive = email.length > 0 && password.length > 0;

  const handleNext = async () => {
    if (!signIn || !signUp || !isActive || !setActive) return;

    setIsLoading(true);
    try {
      // Крок 1: Спробуємо увійти за допомогою пароля
      const { error: signInError } = await signIn.password({
        emailAddress: email,
        password: password,
      });

      if (signInError) {
        console.log("Sign In Error Code:", signInError.code); // Для діагностики в консолі

        // Перевіряємо найбільш розповсюджені коди "користувача не знайдено"
        const isUserNotFound = [
          "form_identifier_not_found",
          "user_not_found",
          "identifier_missing",
        ].includes(signInError.code);

        if (isUserNotFound) {
          // Крок 2: Реєстрація нового користувача
          console.log("User not found, switching to Sign Up...");
          const { error: signUpError } = await signUp.password({
            emailAddress: email,
            password: password,
          });

          if (signUpError) {
            Alert.alert(
              "Помилка реєстрації",
              signUpError.longMessage ?? signUpError.message
            );
            return;
          }

          // Крок 3: Відправляємо код підтвердження
          const { error: sendCodeError } = await signUp.verifications.sendEmailCode();
          if (sendCodeError) {
            Alert.alert("Помилка відправки коду", sendCodeError.message);
            return;
          }

          router.push({
            pathname: "/(auth)/verify-email",
            params: { email, mode: "sign_up" },
          });
          return;
        } else {
          // Якщо це НЕ "user not found", а наприклад "invalid password"
          Alert.alert(
            "Помилка входу",
            signInError.longMessage ?? signInError.message
          );
          return;
        }
      }

      // Якщо вхід успішний — активуємо сесію
      if (signIn.status === "complete") {
        const { error: finalizeError } = await signIn.finalize();
        if (finalizeError) throw finalizeError;

        if (signIn.createdSessionId) {
          await setActive({ session: signIn.createdSessionId });
          router.replace("/(app)/main");
        }
      } else {
        // Якщо потрібна додаткова верифікація (MFA або OTP)
        const { error: sendCodeError } = await signIn.emailCode.sendCode();
        if (!sendCodeError) {
          router.push({
            pathname: "/(auth)/verify-email",
            params: { email, mode: "sign_in" },
          });
        } else {
          throw sendCodeError;
        }
      }
    } catch (error: any) {
      const message = error?.longMessage ?? error?.message ?? "Щось пішло не так";
      Alert.alert("Помилка", message);
      console.error("Email auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          <View style={styles.topContent}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <CloseMDIcon size={24} color={Colors.black} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotPasswordButton}
                activeOpacity={0.7}
                onPress={() => setForgotPasswordVisible(true)}
              >
                <Text style={styles.forgotPasswordText}>Не пам'ятаю пароль</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>Вхід по ел.пошті</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ел. пошта"
                placeholderTextColor={Colors.grayText}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Пароль"
                placeholderTextColor={Colors.grayText}
                secureTextEntry={!isPasswordVisible}
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setPasswordVisible(!isPasswordVisible)}
              >
                {isPasswordVisible ? (
                  <EyeHideIcon size={20} color={Colors.black} />
                ) : (
                  <EyeShowIcon size={20} color={Colors.black} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              isActive ? styles.primaryButtonActive : styles.primaryButtonInactive,
            ]}
            onPress={handleNext}
            activeOpacity={0.8}
            disabled={!isActive || isLoading}
          >
            <Text
              style={[
                styles.primaryButtonText,
                isActive ? styles.primaryButtonTextActive : styles.primaryButtonTextInactive,
              ]}
            >
              Продовжити
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ForgotPasswordModal
        visible={isForgotPasswordVisible}
        onClose={() => setForgotPasswordVisible(false)}
      />
    </View>
  );
}
```

### Логіка `handleNext` — блок-схема:
```
handleNext()
  └─► signIn.password(email, password)
        ├── Успіх: signIn.status === "complete"
        │     └─► signIn.finalize() → setActive() → /(app)/main
        ├── Успіх: signIn.status !== "complete" (потрібен OTP/MFA)
        │     └─► signIn.emailCode.sendCode() → verify-email (mode: sign_in)
        └── Error code: "form_identifier_not_found" (новий користувач)
              └─► signUp.password() → verifications.sendEmailCode()
                    └─► verify-email (mode: sign_up)
```

---

## Частина 2: `app/(auth)/verify-email.tsx`

```tsx
// app/(auth)/verify-email.tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { styles } from "@/src/styles/verifyEmail.styles";
import { useSignIn, useSignUp, useClerk } from "@clerk/expo";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email, mode } = useLocalSearchParams<{
    email: string;
    mode: "sign_in" | "sign_up";
  }>();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { setActive } = useClerk();

  // Автоматична верифікація при введенні 6 цифр
  useEffect(() => {
    if (code.length === 6) {
      handleVerify();
    }
  }, [code]);

  const finalizeAndNavigate = async (sessionId: string) => {
    await setActive({ session: sessionId });
    router.replace("/(app)/main");
  };

  const handleVerify = async () => {
    // Якщо вже йде перевірка або немає необхідних даних - виходимо
    if (!signIn || !signUp || code.length < 6 || !setActive || verifyingRef.current) return;

    verifyingRef.current = true; // Ставимо замок
    setIsLoading(true);

    try {
      if (mode === "sign_up") {
        // Крок 1: Тільки якщо ще не в статусі 'complete'
        if (signUp.status !== "complete") {
          const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code });
          if (verifyError) {
            Alert.alert("Помилка", verifyError.longMessage || verifyError.message || "Неправильний код");
            setCode("");
            return;
          }
        }

        // Крок 2: Завершення (Finalize) для реєстрації
        if (signUp.status === "complete") {
          const { error: finalizeError } = await signUp.finalize();
          if (finalizeError) throw finalizeError;
          if (signUp.createdSessionId) {
            await finalizeAndNavigate(signUp.createdSessionId);
          }
        }
      } else {
        // Верифікація для входу (OTP)
        if (signIn.status !== "complete") {
          const { error: verifyError } = await signIn.emailCode.verifyCode({ code });
          if (verifyError) {
            Alert.alert("Помилка", verifyError.longMessage || verifyError.message || "Неправильний код");
            setCode("");
            return;
          }
        }

        // Крок 2: Завершення (Finalize) для входу
        if (signIn.status === "complete") {
          const { error: finalizeError } = await signIn.finalize();
          if (finalizeError) throw finalizeError;
          if (signIn.createdSessionId) {
            await finalizeAndNavigate(signIn.createdSessionId);
          }
        }
      }
    } catch (error: any) {
      const errorMsg = error?.longMessage || error?.message || "Помилка верифікації";
      
      // Ігноруємо помилку про вже підтверджену верифікацію, якщо ми і так маємо sessionId
      if (error?.code === "already_verified" || errorMsg.toLowerCase().includes("already been verified")) {
        const finalObj = mode === "sign_up" ? signUp : signIn;
        if (finalObj.status === "complete" && finalObj.createdSessionId) {
          await finalizeAndNavigate(finalObj.createdSessionId);
          return;
        }
      }

      Alert.alert("Помилка", errorMsg);
      setCode("");
    } finally {
      setIsLoading(false);
      verifyingRef.current = false; // Знімаємо замок
    }
  };

  const handleResend = async () => {
    try {
      if (mode === "sign_up") {
        if (!signUp) return;
        const { error } = await signUp.verifications.sendEmailCode();
        if (error) throw error;
      } else {
        if (!signIn) return;
        const { error } = await signIn.emailCode.sendCode();
        if (error) throw error;
      }
      Alert.alert("Успішно", "Код відправлено повторно");
    } catch (error: any) {
      Alert.alert("Помилка", error.message);
    }
  };

  // ... JSX рендер
}
```

### Ключові моменти `verify-email.tsx`:
| Деталь | Пояснення |
| :--- | :--- |
| `mode: "sign_in" \| "sign_up"` | Параметр маршруту визначає тип верифікації |
| `signUp.verifications.verifyEmailCode()` | Верифікація коду для нової реєстрації |
| `signIn.emailCode.verifyCode()` | Верифікація коду для повторного входу |
| `signUp.finalize()` / `signIn.finalize()` | Завершує процес та повертає `createdSessionId` |
| `setActive({ session: sessionId })` | Активує сесію Clerk |

---

## Результат цього кроку

- ✅ `login-email.tsx` підтримує **вхід та реєстрацію** — один екран для обох сценаріїв.
- ✅ Автоматичне визначення: `form_identifier_not_found` → реєстрація, успіх → вхід.
- ✅ `verify-email.tsx` підтримує верифікацію для `sign_in` та `sign_up` через параметр `mode`.
- ✅ Реалізована повторна відправка коду через `handleResend`.
- ✅ Автоматична верифікація при введенні 6 цифр (без кнопки).

**Наступний крок →** [06-backend-webhook.md](./06-backend-webhook.md)
