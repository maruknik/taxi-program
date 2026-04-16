import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { useDeleteAccount } from '@/src/hooks/useAccountDeletion';
import { DELETION_REASONS } from '@/src/types/deletion.types';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteAccountModal({ visible, onClose, onSuccess }: DeleteAccountModalProps) {
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState<string>(DELETION_REASONS[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'confirm' | 'details'>('confirm');
  const [showReasonPicker, setShowReasonPicker] = useState(false);

  const deleteAccount = useDeleteAccount();

  const handleConfirmDeletion = () => {
    setStep('details');
  };

  const handleDeleteAccount = async () => {
    if (!password.trim()) {
      Alert.alert('Помилка', 'Введіть пароль для підтвердження');
      return;
    }

    try {
      await deleteAccount.mutateAsync({
        password: password.trim(),
        reason,
      });

      Alert.alert(
        'Акаунт видалено',
        'Ваш акаунт деактивовано. Дані будуть повністю видалені через 30 днів.',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error: any) {
      const message = error.response?.data?.error || 'Не вдалося видалити акаунт';
      Alert.alert('Помилка', message);
    }
  };

  const resetModal = () => {
    setStep('confirm');
    setPassword('');
    setReason(DELETION_REASONS[0]);
    setShowPassword(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {step === 'confirm' ? (
            // Confirmation Step
            <>
              <View style={styles.iconContainer}>
                <Ionicons name="warning" size={48} color={Colors.error} />
              </View>

              <Text style={styles.title}>Видалити акаунт?</Text>
              <Text style={styles.description}>
                Ця дія буде остаточною, дані відновити буде не можливо
              </Text>

              <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>Що буде видалено:</Text>
                <Text style={styles.warningItem}>• Особисті дані та профіль</Text>
                <Text style={styles.warningItem}>• Історія всіх поїздок</Text>
                <Text style={styles.warningItem}>• Збережені адреси</Text>
                <Text style={styles.warningItem}>• Платіжні методи</Text>
                <Text style={styles.warningItem}>• Налаштування додатку</Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                  <Text style={styles.cancelButtonText}>Назад</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.deleteButton} onPress={handleConfirmDeletion}>
                  <Text style={styles.deleteButtonText}>Видалити</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // Details Step
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed" size={48} color={Colors.error} />
              </View>

              <Text style={styles.title}>Підтвердження видалення</Text>
              <Text style={styles.description}>
                Введіть пароль та причину видалення акаунту
              </Text>

              {/* Reason Selection */}
              <View style={styles.field}>
                <Text style={styles.label}>Причина видалення</Text>
                <TouchableOpacity
                  style={styles.reasonSelector}
                  onPress={() => setShowReasonPicker(true)}
                >
                  <Text style={styles.reasonText} numberOfLines={2}>{reason}</Text>
                  <Ionicons name="chevron-down" size={20} color={Colors.grayText} />
                </TouchableOpacity>
              </View>

              {/* Reason Picker Modal */}
              <Modal
                visible={showReasonPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowReasonPicker(false)}
              >
                <TouchableOpacity
                  style={styles.reasonOverlay}
                  activeOpacity={1}
                  onPress={() => setShowReasonPicker(false)}
                >
                  <View style={styles.reasonSheet}>
                    <Text style={styles.reasonSheetTitle}>Причина видалення</Text>
                    {DELETION_REASONS.map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.reasonItem,
                          reason === r && styles.reasonItemSelected,
                        ]}
                        onPress={() => { setReason(r); setShowReasonPicker(false); }}
                      >
                        <Text style={[
                          styles.reasonItemText,
                          reason === r && styles.reasonItemTextSelected,
                        ]}>{r}</Text>
                        {reason === r && (
                          <Ionicons name="checkmark" size={20} color={Colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              </Modal>

              {/* Password Confirmation */}
              <View style={styles.field}>
                <Text style={styles.label}>Підтвердіть паролем</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Введіть ваш пароль"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-off' : 'eye'} 
                      size={20} 
                      color={Colors.grayText} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setStep('confirm')}
                >
                  <Text style={styles.cancelButtonText}>Назад</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.deleteButton,
                    !password.trim() && styles.disabledButton
                  ]}
                  onPress={handleDeleteAccount}
                  disabled={!password.trim() || deleteAccount.isPending}
                >
                  <Text style={styles.deleteButtonText}>
                    {deleteAccount.isPending ? 'Видаляємо...' : 'Підтвердити видалення'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
  },
  scrollContent: {
    paddingBottom: 8,
  },

  // Icon
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },

  // Content
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.grayText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },

  // Warning Box
  warningBox: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
  },
  warningItem: {
    fontSize: 13,
    color: Colors.grayText,
    marginBottom: 4,
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
  reasonSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 50,
  },
  reasonText: {
    flex: 1,
    fontSize: 15,
    color: Colors.black,
    marginRight: 8,
    lineHeight: 20,
  },
  reasonOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  reasonSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  reasonSheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  reasonItemSelected: {
    backgroundColor: '#F5F0FF',
  },
  reasonItemText: {
    flex: 1,
    fontSize: 15,
    color: Colors.black,
  },
  reasonItemTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
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
  eyeButton: {
    padding: 12,
  },

  // Buttons
  buttonContainer: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    paddingVertical: 14,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.black,
    fontWeight: '500',
  },
  deleteButton: {
    paddingVertical: 14,
    backgroundColor: Colors.error,
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  disabledButton: {
    backgroundColor: Colors.grayText,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
  },
});
