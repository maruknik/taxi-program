import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { useChangePassword, useCheckPasswordStrength } from '@/src/hooks/usePasswordSecurity';
import { PasswordStrengthIndicator } from '@/src/components/security/PasswordStrengthIndicator';
import { PasswordStrength } from '@/src/types/security.types';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const changePassword = useChangePassword();
  const checkPasswordStrength = useCheckPasswordStrength();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Check password strength when new password changes
  useEffect(() => {
    if (newPassword.length > 0) {
      const timeoutId = setTimeout(() => {
        checkPasswordStrength.mutate(newPassword, {
          onSuccess: (strength) => {
            setPasswordStrength(strength);
          },
        });
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setPasswordStrength(null);
    }
  }, [newPassword]);

  const validateForm = () => {
    if (!currentPassword.trim()) {
      Alert.alert('Помилка', 'Введіть поточний пароль');
      return false;
    }

    if (!newPassword.trim()) {
      Alert.alert('Помилка', 'Введіть новий пароль');
      return false;
    }

    if (newPassword.length < 8) {
      Alert.alert('Помилка', 'Новий пароль повинен містити принаймні 8 символів');
      return false;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('Помилка', 'Підтвердіть новий пароль');
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Помилка', 'Паролі не збігаються');
      return false;
    }

    if (passwordStrength && !passwordStrength.valid) {
      Alert.alert('Помилка', passwordStrength.errors[0]);
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    try {
      await changePassword.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setShowSuccessModal(true);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Не вдалося змінити пароль';
      Alert.alert('Помилка', message);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Змінити пароль</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Current Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Поточний пароль</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Введіть поточний пароль"
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons 
                  name={showCurrentPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color={Colors.grayText} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Новий пароль (понад 8 символів)</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Введіть новий пароль"
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons 
                  name={showNewPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color={Colors.grayText} 
                />
              </TouchableOpacity>
            </View>
            
            <PasswordStrengthIndicator strength={passwordStrength} />
          </View>

          {/* Confirm Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Повторити пароль</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.passwordInput,
                  confirmPassword && newPassword !== confirmPassword && styles.errorInput
                ]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Повторіть новий пароль"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color={Colors.grayText} 
                />
              </TouchableOpacity>
            </View>
            
            {confirmPassword && newPassword !== confirmPassword && (
              <Text style={styles.errorText}>Паролі не збігаються</Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!currentPassword || !newPassword || !confirmPassword || 
               newPassword !== confirmPassword) && styles.disabledButton
            ]}
            onPress={handleChangePassword}
            disabled={
              !currentPassword || !newPassword || !confirmPassword || 
              newPassword !== confirmPassword || changePassword.isPending
            }
          >
            <Text style={styles.submitButtonText}>
              {changePassword.isPending ? 'Змінюємо...' : 'Підтвердити'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="lock-closed" size={48} color={Colors.success} />
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={24} color={Colors.white} />
              </View>
            </View>
            
            <Text style={styles.successTitle}>Пароль змінено</Text>
            <Text style={styles.successMessage}>
              Тепер ваш акаунт у безпеці. Ви можете продовжити користування.
            </Text>
            
            <TouchableOpacity
              style={styles.successButton}
              onPress={handleSuccessModalClose}
            >
              <Text style={styles.successButtonText}>Добре</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },

  // Form Fields
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.black,
  },
  errorInput: {
    borderColor: Colors.error,
  },
  eyeButton: {
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },

  // Submit Button
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: Colors.grayText,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },

  // Success Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  successIcon: {
    position: 'relative',
    marginBottom: 24,
  },
  checkmark: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: Colors.grayText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    minWidth: 120,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
  },
});
