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
import { useSSO } from "@/src/hooks/useSSO";

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
  const { startSSOFlow: handleGoogleSignIn } = useSSO("oauth_google");

  const handleNext = async () => {
    if (!signIn || !signUp) return;

    setIsLoading(true);
    try {
      const fullPhoneNumber = `${selectedCountry.code}${phoneNumber}`;

      // Крок 1: Ініціюємо вхід з signUpIfMissing — код буде надіслано незалежно від того, 
      // чи існує акаунт. Це безпечний спосіб за документацією Clerk.
      const { error: createError } = await signIn.create({
        identifier: fullPhoneNumber,
        signUpIfMissing: true,
      } as Parameters<typeof signIn.create>[0]);

      if (createError) {
        const message = createError.longMessage ?? createError.message ?? "Щось пішло не так";
        Alert.alert("Помилка", message);
        return;
      }

      // Крок 2: Відправляємо код по телефону
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

  const isActive = phoneNumber.length >= 7; // Симуляція активного стану

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
              <ArrowDownIcon
                size={14}
                color={Colors.black}
                style={styles.caret}
              />
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
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              isActive
                ? styles.primaryButtonActive
                : styles.primaryButtonInactive,
            ]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.primaryButtonText,
                isActive
                  ? styles.primaryButtonTextActive
                  : styles.primaryButtonTextInactive,
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

          <TouchableOpacity 
            style={styles.secondaryButton} 
            activeOpacity={0.7}
            onPress={handleGoogleSignIn}
          >
            <GoogleIcon size={20} style={styles.socialIcon} />
            <Text style={styles.secondaryButtonText}>
              Увійти за допомогою Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={() => router.push("/(auth)/login-email")}
          >
            <SocialEmailIcon
              size={22}
              color={Colors.black}
              style={styles.socialIcon}
            />
            <Text style={styles.secondaryButtonText}>
              Продовжити з електронною поштою
            </Text>
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
