import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { styles } from "@/src/styles/verifyEmail.styles";
import { useSignIn, useSignUp, useClerk } from "@clerk/expo";
import { Alert } from "react-native";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email, mode } = useLocalSearchParams<{
    email: string;
    mode: "sign_in" | "sign_up";
  }>();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const verifyingRef = useRef(false);
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { setActive } = useClerk();

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
    if (!signIn || !signUp || code.length < 6 || !setActive || verifyingRef.current) return;

    verifyingRef.current = true;
    setIsLoading(true);

    try {
      if (mode === "sign_up") {
        if (signUp.status !== "complete") {
          const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code });
          if (verifyError) {
            Alert.alert("Помилка", verifyError.longMessage || verifyError.message || "Неправильний код");
            setCode("");
            return;
          }
        }

        if (signUp.status === "complete") {
          const { error: finalizeError } = await signUp.finalize();
          if (finalizeError) throw finalizeError;
          if (signUp.createdSessionId) await finalizeAndNavigate(signUp.createdSessionId);
        }
      } else {
        if (signIn.status !== "complete") {
          const { error: verifyError } = await signIn.emailCode.verifyCode({ code });
          if (verifyError) {
            Alert.alert("Помилка", verifyError.longMessage || verifyError.message || "Неправильний код");
            setCode("");
            return;
          }
        }

        if (signIn.status === "complete") {
          const { error: finalizeError } = await signIn.finalize();
          if (finalizeError) throw finalizeError;
          if (signIn.createdSessionId) await finalizeAndNavigate(signIn.createdSessionId);
        }
      }
    } catch (error: any) {
      const errorMsg = error?.longMessage || error?.message || "Помилка верифікації";
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
      verifyingRef.current = false;
    }
  };

  const handleResend = async () => {
    try {
      if (mode === "sign_up") {
        await signUp?.verifications.sendEmailCode();
      } else {
        await signIn?.emailCode.sendCode();
      }
      Alert.alert("Код відправлено", "Перевірте пошту");
    } catch (error: any) {
      Alert.alert("Помилка", error.message);
    }
  };

  const renderCodeBoxes = () => {
    return [0, 1, 2, 3, 4, 5].map((index) => {
      const isFocused = code.length === index;
      return (
        <View key={index} style={[styles.codeBox, isFocused && styles.codeBoxError]}>
          <Text style={styles.codeText}>{code[index] || ""}</Text>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          <View style={styles.topContent}>
            <Text style={styles.title}>Підтвердьте вхід</Text>
            <Text style={styles.subtitle}>Код надіслано на {email}</Text>

            <View style={styles.codeContainer}>
              <View style={styles.boxesContainer}>{renderCodeBoxes()}</View>
              <TextInput
                ref={inputRef}
                style={styles.hiddenInput}
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                autoFocus
              />
            </View>
            
            {isLoading && (
              <View style={{ marginTop: 20 }}>
                 <ActivityIndicator size="large" color="#1a1a1a" />
              </View>
            )}
          </View>

          <View>
            <TouchableOpacity style={styles.pillButton} onPress={handleResend}>
              <Text style={styles.pillButtonText}>Отримати код повторно</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pillButton} onPress={() => router.back()}>
              <Text style={styles.pillButtonText}>Змінити Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
