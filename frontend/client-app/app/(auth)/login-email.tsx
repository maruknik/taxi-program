import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { styles } from "@/src/styles/loginEmail.styles";
import { Colors } from "@/src/constants/theme";
import ForgotPasswordModal from "@/src/components/ForgotPasswordModal";
import { CloseMDIcon, EyeShowIcon, EyeHideIcon } from "@/src/components/icons";
import { useSignIn, useSignUp, useClerk } from "@clerk/expo";
import { Alert } from "react-native";

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
      const { error: signInError } = await signIn.password({
        emailAddress: email,
        password: password,
      });

      const isUserNotFound = 
        signIn.isTransferable || 
        (signInError && (
          [
            "form_identifier_not_found",
            "user_not_found",
            "identifier_not_found",
            "identifier_missing",
          ].includes(signInError.code) ||
          (signInError as any).errors?.[0]?.code === "form_identifier_not_found" ||
          signInError.longMessage?.toLowerCase().includes("find your account")
        ));

      if (signInError && isUserNotFound) {
        const { error: signUpError } = await signUp.password({
          emailAddress: email,
          password: password,
        });

        if (signUpError) {
          Alert.alert("Помилка", signUpError.longMessage || signUpError.message);
          return;
        }

        const { error: sendCodeError } = await signUp.verifications.sendEmailCode();
        if (sendCodeError) {
          Alert.alert("Помилка", sendCodeError.message);
          return;
        }

        router.push({
          pathname: "/(auth)/verify-email",
          params: { email, mode: "sign_up" },
        });
        return;
      } else if (signInError) {
        Alert.alert("Помилка входу", signInError.longMessage || signInError.message);
        return;
      }

      if (signIn.status === "complete") {
        const { error: finalizeError } = await signIn.finalize();
        if (finalizeError) throw finalizeError;
        if (signIn.createdSessionId) {
          await setActive({ session: signIn.createdSessionId });
          router.replace("/(app)/main");
        }
      } else {
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
      Alert.alert("Помилка", error?.longMessage || error?.message || "Невідома помилка");
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
              >
                <CloseMDIcon size={24} color={Colors.black} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.forgotPasswordButton}
                onPress={() => setForgotPasswordVisible(true)}
              >
                <Text style={styles.forgotPasswordText}>Забули пароль?</Text>
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
              {isLoading ? "Завантаження..." : "Продовжити"}
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
