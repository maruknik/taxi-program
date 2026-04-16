import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { styles } from "@/src/styles/verify.styles";
import { Colors } from "@/src/constants/theme";
import { ArrowLeftIcon } from "@/src/components/icons";
import { useSignIn, useSignUp, useClerk } from "@clerk/expo";
import { Alert } from "react-native";

export default function VerifyScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
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
    if (!signIn || !signUp || code.length < 6) return;

    setIsLoading(true);
    try {
      // Крок 1: Верифікуємо код через signIn.phoneCode
      const { error: verifyError } = await signIn.phoneCode.verifyCode({ code });

      if (verifyError) {
        // Якщо помилка sign_up_if_missing_transfer — користувач новий, робимо transfer
        const isTransfer = verifyError.code === "sign_up_if_missing_transfer";

        if (isTransfer) {
          // Крок 2: Переносимо підтверджений номер до реєстрації
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

      // Якщо помилок немає — користувач існую, завершуємо вхід
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


  const isError = false; 

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeftIcon size={20} color={Colors.black} />
          </TouchableOpacity>
 
          <Text style={styles.title}>Раді бачити вас!</Text>
 
          <Text style={styles.subtitle}>
            Для входу введіть 6-значний код, отриманий у SMS на номер{"\n"}
            {phone || "+380XXXXXXXXX"}.
          </Text>
 
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>Інший номер телефону?</Text>
          </TouchableOpacity>
 
          <View style={styles.codeContainer}>
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ""))}
              maxLength={6}
              keyboardType="number-pad"
              style={styles.hiddenInput}
              autoFocus={true}
            />
 
            {/* Візуальні блоки для коду */}
            <View style={styles.boxesContainer} pointerEvents="none">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const isActive = code.length === index;
                const isFilled = code.length > index;
                return (
                  <View
                    key={index}
                    style={[
                      styles.codeBox,
                      isError && styles.codeBoxError,
                      isActive && !isError && styles.codeBoxActive,
                    ]}
                  >
                    <Text style={styles.codeText}>{code[index] || ""}</Text>
                  </View>
                );
              })}
            </View>
          </View>
 
          {isError ? (
            <Text style={styles.errorText}>Неправильний код</Text>
          ) : (
            <View style={{ height: 20, marginBottom: 20 }} /> 
          )}
 
          <TouchableOpacity 
            style={styles.pillButton} 
            activeOpacity={0.7}
            onPress={handleResend}
          >
            <Text style={styles.pillButtonText}>Отримати код повторно</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pillButton} activeOpacity={0.7}>
            <Text style={styles.pillButtonText}>
              Увійти через електронну пошту
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
