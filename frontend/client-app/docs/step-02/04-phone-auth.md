# Крок 2.4: Реалізація входу за номером телефону

У цьому документі ми реалізуємо вхід за номером телефону (SMS OTP) з підтримкою автоматичної реєстрації нових користувачів. Використовується **Clerk 6 Future API** (`@clerk/expo` v3.x).

---

## Як працює Phone Auth у Clerk 6

```
┌─ login.tsx ──────────────────────────────────────────────┐
│ 1. Користувач вводить номер телефону                      │
│ 2. signIn.create({ identifier, signUpIfMissing: true })   │──► Clerk надсилає SMS
│    (код відправляється незалежно чи існує акаунт)          │    незалежно від того,
└───────────────────────────────────────────────────────────┘    чи існує акаунт
                   │
                   ▼
┌─ verify.tsx ─────────────────────────────────────────────┐
│ 3. Користувач вводить 4-значний код                       │
│ 4. signIn.phoneCode.verifyCode({ code })                  │──► Clerk верифікує
│    │                                                       │
│    ├── Успіх (існуючий user) → signIn.finalize()           │──► Сесія активована
│    │                                                       │
│    └── Помилка sign_up_if_missing_transfer                 │
│        (новий user) → signUp.create({ transfer: true })    │──► Реєстрація та
│                     → signUp.finalize()                    │    активація сесії
└───────────────────────────────────────────────────────────┘
```

### Ключова відмінність від Legacy API

| Legacy API (застарілий) | Future API (Clerk 6, поточний) |
| :--- | :--- |
| `signIn.prepareFirstFactor({ strategy: "phone_code" })` | `signIn.phoneCode.sendCode()` |
| `signIn.attemptFirstFactor({ strategy: "phone_code", code })` | `signIn.phoneCode.verifyCode({ code })` |
| Перевірка через `try/catch errors[0].code` | Перевірка через `const { error } = await ...` |
| `setActive({ session: result.createdSessionId })` | `signIn.finalize()` → автоматично |

---

## Частина 1: `app/(auth)/login.tsx`

```tsx
// app/(auth)/login.tsx
import CountryPickerModal from "@/src/components/CountryPickerModal";
import {
  ArrowDownIcon,
  GoogleIcon,
  SocialEmailIcon,
} from "@/src/components/icons";
import { Colors } from "@/src/constants/theme";
import { styles } from "@/src/styles/login.styles";
import { DEFAULT_COUNTRY } from "@/src/utils/countries";
import { useSignIn, useSignUp } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCountryModalVisible, setCountryModalVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const isActive = phoneNumber.length >= 7;

  const handleNext = async () => {
    if (!signIn || !signUp) return;

    setIsLoading(true);
    try {
      const fullPhoneNumber = `${selectedCountry.code}${phoneNumber}`;

      // Крок 1: signUpIfMissing — Clerk надішле код незалежно від того,
      // чи існує акаунт. Після верифікації сам визначить: вхід чи реєстрація.
      const { error: createError } = await signIn.create({
        identifier: fullPhoneNumber,
        signUpIfMissing: true,
      } as Parameters<typeof signIn.create>[0]);

      if (createError) {
        const message = createError.longMessage ?? createError.message ?? "Щось пішло не так";
        Alert.alert("Помилка", message);
        return;
      }

      // Крок 2: Відправляємо SMS-код
      const { error: sendError } = await signIn.phoneCode.sendCode();
      if (sendError) {
        const message = sendError.longMessage ?? sendError.message ?? "Помилка відправки коду";
        Alert.alert("Помилка", message);
        return;
      }

      // Переходимо на екран верифікації
      router.push({
        pathname: "/(auth)/verify",
        params: { phone: fullPhoneNumber },
      });
    } catch (error: any) {
      const message = error?.longMessage ?? error?.message ?? "Щось пішло не так";
      Alert.alert("Помилка входу", message);
      console.error("Phone sign-in error:", error);
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
          <Text style={styles.title}>Номер мобільного телефону</Text>

          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.countryPicker}
              activeOpacity={0.7}
              onPress={() => setCountryModalVisible(true)}
            >
              <Text style={styles.flag}>{selectedCountry.flag}</Text>
              <ArrowDownIcon size={14} color={Colors.black} style={styles.caret} />
            </TouchableOpacity>

            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>{selectedCountry.code}</Text>
              <TextInput
                style={styles.input}
                placeholder="Номер телефону"
                placeholderTextColor={Colors.grayText}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={9}
                editable={!isLoading}
              />
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
              Увійти
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>або</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7}>
            <GoogleIcon size={20} style={styles.socialIcon} />
            <Text style={styles.secondaryButtonText}>Увійти за допомогою Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={() => router.push("/(auth)/login-email")}
          >
            <SocialEmailIcon size={22} color={Colors.black} style={styles.socialIcon} />
            <Text style={styles.secondaryButtonText}>Продовжити з електронною поштою</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Продовжуючи, ви приймаєте Умови користування та ознайомлені з
            Політикою конфіденційності VARD.
          </Text>
        </View>
      </KeyboardAvoidingView>

      <CountryPickerModal
        visible={isCountryModalVisible}
        onClose={() => setCountryModalVisible(false)}
        onSelect={(country) => setSelectedCountry(country)}
      />
    </View>
  );
}
```

### Що змінилось порівняно з Legacy API:
| Було (Legacy) | Стало (Future API) |
| :--- | :--- |
| `signIn.create({ identifier })` + `prepareFirstFactor()` | `signIn.create({ identifier, signUpIfMissing: true })` |
| Перехоплення `catch(error.errors[0].code)` | `const { error } = await signIn.create()` |
| Окремий flow для реєстрації | Автоматично через `signUpIfMissing` |
| `signIn.prepareFirstFactor({ strategy: "phone_code" })` | `signIn.phoneCode.sendCode()` |

---

## Частина 2: `app/(auth)/verify.tsx`

```tsx
// app/(auth)/verify.tsx
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { styles } from "@/src/styles/verify.styles";
import { Colors } from "@/src/constants/theme";
import { ArrowLeftIcon } from "@/src/components/icons";
import { useSignIn, useSignUp, useClerk } from "@clerk/expo";

export default function VerifyScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { setActive } = useClerk();

  // Автоматична верифікація при введенні 4 цифр
  useEffect(() => {
    if (code.length === 4) {
      handleVerify();
    }
  }, [code]);

  const finalizeAndNavigate = async (sessionId: string) => {
    await setActive({ session: sessionId });
    router.replace("/(app)/main");
  };

  const handleVerify = async () => {
    if (!signIn || !signUp || code.length < 4) return;

    setIsLoading(true);
    try {
      // Крок 1: Верифікуємо код через signIn.phoneCode
      const { error: verifyError } = await signIn.phoneCode.verifyCode({ code });

      if (verifyError) {
        // sign_up_if_missing_transfer — користувач новий, потрібна реєстрація
        const isTransfer = verifyError.code === "sign_up_if_missing_transfer";

        if (isTransfer) {
          // Крок 2: Переносимо підтверджений номер у новий sign-up
          const { error: transferError } = await signUp.create({ transfer: true });
          if (transferError) throw transferError;

          // Крок 3: Завершуємо реєстрацію
          if (signUp.status === "complete") {
            const { error: finalizeError } = await signUp.finalize();
            if (finalizeError) throw finalizeError;
            if (signUp.createdSessionId) {
              await finalizeAndNavigate(signUp.createdSessionId);
            }
          } else {
            throw new Error(`Неочікуваний статус реєстрації: ${signUp.status}`);
          }
        } else {
          // Інша помилка (неправильний код тощо)
          const message = verifyError.longMessage ?? verifyError.message ?? "Неправильний код";
          Alert.alert("Помилка верифікації", message);
          setCode("");
        }
        return;
      }

      // Якщо помилок немає — існуючий користувач, завершуємо вхід
      if (signIn.status === "complete") {
        const { error: finalizeError } = await signIn.finalize();
        if (finalizeError) throw finalizeError;
        if (signIn.createdSessionId) {
          await finalizeAndNavigate(signIn.createdSessionId);
        }
      } else {
        throw new Error(`Неочікуваний статус входу: ${signIn.status}`);
      }
    } catch (error: any) {
      const message = error?.longMessage ?? error?.message ?? "Щось пішло не так";
      Alert.alert("Помилка", message);
      setCode("");
      console.error("Verify error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!signIn) return;
    try {
      const { error } = await signIn.phoneCode.sendCode();
      if (error) throw error;
      Alert.alert("Успішно", "Код відправлено повторно");
    } catch (error: any) {
      Alert.alert("Помилка", error.message);
    }
  };

  // ... JSX (рендер боксів для коду, кнопок тощо)
}
```

### Ключові моменти `verify.tsx`:
| Деталь | Пояснення |
| :--- | :--- |
| `signIn.phoneCode.verifyCode({ code })` | Перевіряє SMS-код через Future API |
| `error.code === "sign_up_if_missing_transfer"` | Ознака нового користувача — треба реєструватись |
| `signUp.create({ transfer: true })` | Переносить підтверджений номер у sign-up без повторної відправки SMS |
| `signIn.finalize()` / `signUp.finalize()` | Завершує сесію та повертає `createdSessionId` |
| `setActive({ session: sessionId })` | Активує сесію — `useAuth().isSignedIn` стає `true` |
| `useEffect` на `code.length === 4` | Автоматична верифікація без кнопки "Підтвердити" |

---

## Важливо: Підтримка країн у Clerk

> [!WARNING]
> Clerk в режимі **Development** за замовчуванням обмежує деякі країни для SMS (включаючи Україну +380). Якщо ви бачите помилку **"Phone numbers from this country (Ukraine) are currently not supported"**:
>
> 1. Відкрийте [Clerk Dashboard](https://dashboard.clerk.com) → ваш застосунок.
> 2. Перейдіть до **Configure → SMS**.
> 3. У розділі **"Supported countries"** знайдіть і увімкніть **Ukraine (+380)**.

---

## Результат цього кроку

- ✅ `login.tsx` відправляє SMS через Clerk Future API з `signUpIfMissing: true`.
- ✅ `verify.tsx` верифікує OTP та правильно розрізняє вхід/реєстрацію.
- ✅ Нові користувачі автоматично реєструються через `transfer: true`.
- ✅ Після успішного входу/реєстрації сесія активується та відбувається навігація.

**Наступний крок →** [05-email-auth.md](./05-email-auth.md)
