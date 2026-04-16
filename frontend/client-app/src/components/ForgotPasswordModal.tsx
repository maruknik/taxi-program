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
import { styles } from "../styles/forgotPassword.styles";
import { Colors } from "../constants/theme";
import { CloseMDIcon } from "@/src/components/icons";

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

  // Симуляція помилки як на макеті
  const isEmailError =
    email.includes(";") || (email.length > 5 && !email.includes("@"));

  const handleContinue = () => {
    if (email.length > 0 && !isEmailError) {
      setStep("success");
    }
  };

  const handleDone = () => {
    setStep("request");
    setEmail("");
    onClose();
  };

  const handleClose = () => {
    setStep("request");
    setEmail("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.content}>
            <View style={styles.topContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <CloseMDIcon size={24} color={Colors.black} />
              </TouchableOpacity>

              {step === "request" ? (
                <>
                  <Text style={styles.title}>Не пам’ятаєш пароль?</Text>
                  <Text style={styles.subtitle}>
                    Вкажіть свій email і ми відправимо тобі посилання на
                    скидування паролю
                  </Text>

                  <View
                    style={[
                      styles.inputContainer,
                      isEmailError && styles.inputError,
                    ]}
                  >
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
                    <Text style={styles.errorText}>
                      Електрона пошта введена не вірно
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.successImageContainer}>
                    <Image
                      source={require("@/assets/images/check_email.png")} // Ми припустимо, що файл там, але в коді нижче ми це поправимо або використаємо локальний шлях
                      style={styles.successImage}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.title}>Перевір електронну пошту</Text>
                  <Text style={styles.successDescription}>
                    Ми надіслали лист з інструкцією на адресу{"\n"}
                    <Text style={{ fontWeight: "600" }}>
                      {email || "vard777@gmail.com"}
                    </Text>
                  </Text>
                  <Text style={styles.successSubDescription}>
                    Лист не прийшов? Перевір папку зі спамом або спробуй ще раз
                  </Text>
                </>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                email.length > 0 && !isEmailError
                  ? styles.primaryButtonActive
                  : styles.primaryButtonInactive,
              ]}
              onPress={step === "request" ? handleContinue : handleDone}
              disabled={
                step === "request" && (email.length === 0 || isEmailError)
              }
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  email.length > 0 && !isEmailError
                    ? styles.primaryButtonTextActive
                    : styles.primaryButtonTextInactive,
                ]}
              >
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
