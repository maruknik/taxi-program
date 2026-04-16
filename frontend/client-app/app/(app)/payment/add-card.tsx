import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { CardInput } from '@/src/components/payment/CardInput';
import { useAddCard } from '@/src/hooks/usePaymentMethods';
import { AddCardSuccessModal } from '@/src/components/payment/AddCardSuccessModal';

interface CardForm {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
}

interface FormErrors {
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  cardholderName?: string;
}

export default function AddCardScreen() {
  const router = useRouter();
  const addCard = useAddCard();
  
  const [form, setForm] = useState<CardForm>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Refs для навігації між полями
  const expiryRef = useRef<TextInput>(null);
  const cvvRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Валідація номера картки
    const cleanCardNumber = form.cardNumber.replace(/\s/g, '');
    if (!cleanCardNumber) {
      newErrors.cardNumber = 'Введіть номер картки';
    } else if (cleanCardNumber.length < 16) {
      newErrors.cardNumber = 'Перевірте номер картки';
    } else if (!isValidCardNumber(cleanCardNumber)) {
      newErrors.cardNumber = 'Невірний номер картки';
    }

    // Валідація терміну дії
    const month = parseInt(form.expiryMonth);
    const year = parseInt(form.expiryYear);
    
    if (!form.expiryMonth || !form.expiryYear) {
      newErrors.expiryMonth = 'Обов\'язково';
      newErrors.expiryYear = 'Обов\'язково';
    } else if (month < 1 || month > 12) {
      newErrors.expiryMonth = 'Перевірте термін дії';
    } else if (year < 24 || year > 40) {
      newErrors.expiryYear = 'Перевірте термін дії';
    } else {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        newErrors.expiryMonth = 'Перевірте термін дії';
        newErrors.expiryYear = 'Перевірте термін дії';
      }
    }

    // Валідація CVV
    if (!form.cvv) {
      newErrors.cvv = 'Обов\'язково';
    } else if (form.cvv.length < 3) {
      newErrors.cvv = 'Мінімум 3 цифри';
    }

    // Валідація імені
    if (!form.cardholderName.trim()) {
      newErrors.cardholderName = 'Введіть ім\'я власника картки';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidCardNumber = (cardNumber: string): boolean => {
    // Luhn algorithm
    let sum = 0;
    let alternate = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let n = parseInt(cardNumber.charAt(i));
      
      if (alternate) {
        n *= 2;
        if (n > 9) {
          n = (n % 10) + 1;
        }
      }
      
      sum += n;
      alternate = !alternate;
    }
    
    return sum % 10 === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const cardData = {
        card_number: form.cardNumber.replace(/\s/g, ''),
        expiry_month: form.expiryMonth,
        expiry_year: (2000 + parseInt(form.expiryYear)).toString(),
        cvv: form.cvv,
        cardholder_name: form.cardholderName,
        set_as_default: true,
      };

      await addCard.mutateAsync(cardData);
      setShowSuccess(true);
      
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося додати картку. Спробуйте ще раз.');
      console.error('Add card error:', error);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.back();
  };

  const updateField = (field: keyof CardForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Очистити помилку при введенні
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatExpiry = (text: string, field: 'expiryMonth' | 'expiryYear') => {
    const numbers = text.replace(/\D/g, '');
    
    if (field === 'expiryMonth') {
      return numbers.slice(0, 2);
    } else {
      return numbers.slice(0, 2);
    }
  };

  const isFormValid = () => {
    return (
      form.cardNumber.replace(/\s/g, '').length >= 16 &&
      form.expiryMonth.length === 2 &&
      form.expiryYear.length === 2 &&
      form.cvv.length >= 3 &&
      form.cardholderName.trim().length > 0
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Додати картку</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isFormValid() || addCard.isPending}
          >
            <Text
              style={[
                styles.saveText,
                (!isFormValid() || addCard.isPending) && styles.saveTextDisabled,
              ]}
            >
              {addCard.isPending ? 'Зберігаємо...' : 'Готово'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Card Number */}
          <CardInput
            value={form.cardNumber}
            onChangeText={(text) => updateField('cardNumber', text)}
            placeholder="Номер картки"
            error={errors.cardNumber}
            maxLength={19}
            keyboardType="numeric"
            autoFocus
            showCardType
            onSubmitEditing={() => expiryRef.current?.focus()}
          />

          {/* Expiry Date and CVV */}
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <CardInput
                value={form.expiryMonth}
                onChangeText={(text) => {
                  const formatted = formatExpiry(text, 'expiryMonth');
                  updateField('expiryMonth', formatted);
                  if (formatted.length === 2) {
                    // Auto focus next field
                    setTimeout(() => cvvRef.current?.focus(), 100);
                  }
                }}
                placeholder="Термін дії"
                error={errors.expiryMonth}
                maxLength={2}
                keyboardType="numeric"
                ref={expiryRef}
              />
            </View>
            
            <View style={styles.halfWidth}>
              <CardInput
                value={form.cvv}
                onChangeText={(text) => {
                  const numbers = text.replace(/\D/g, '');
                  updateField('cvv', numbers);
                }}
                placeholder="CVV"
                error={errors.cvv}
                maxLength={4}
                keyboardType="numeric"
                secureTextEntry
                onSubmitEditing={() => nameRef.current?.focus()}
                ref={cvvRef}
              />
            </View>
          </View>

          {/* Year Input */}
          <CardInput
            value={form.expiryYear}
            onChangeText={(text) => {
              const formatted = formatExpiry(text, 'expiryYear');
              updateField('expiryYear', formatted);
            }}
            placeholder="Рік (YY)"
            error={errors.expiryYear}
            maxLength={2}
            keyboardType="numeric"
          />

          {/* Cardholder Name */}
          <CardInput
            value={form.cardholderName}
            onChangeText={(text) => updateField('cardholderName', text.toUpperCase())}
            placeholder="Ім'я власника картки"
            error={errors.cardholderName}
            autoFocus={false}
            ref={nameRef}
          />

          {/* Security Info */}
          <View style={styles.securityInfo}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
            <Text style={styles.securityText}>
              Для перевірки картки ваш банк може тимчасово 
              утримувати невелику суму на рахунку. Кошти незабаром 
              повернуться на рахунок.{' '}
              <Text style={styles.learnMoreText}>Дізнатись більше</Text>
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isFormValid() || addCard.isPending) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid() || addCard.isPending}
          >
            <Text style={styles.submitButtonText}>
              {addCard.isPending ? 'Додаємо картку...' : 'Додати картку'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <AddCardSuccessModal
        visible={showSuccess}
        onClose={handleSuccessClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  saveText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  saveTextDisabled: {
    color: Colors.grayText,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },

  // Form
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },

  // Security Info
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    marginTop: 20,
  },
  securityText: {
    marginLeft: 8,
    fontSize: 12,
    color: Colors.grayText,
    lineHeight: 16,
    flex: 1,
  },
  learnMoreText: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },

  // Bottom
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 16,
  },
  submitButton: {
    paddingVertical: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.grayText,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
