import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { PaymentMethodSelector } from '@/src/components/payment/PaymentMethodSelector';
import { PaymentProcessor } from '@/src/components/payment/PaymentProcessor';
import { PaymentMethod } from '@/src/types/payment.types';

export default function TestPaymentProcessorScreen() {
  const router = useRouter();
  const [showSelector, setShowSelector] = useState(false);
  const [showProcessor, setShowProcessor] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setShowSelector(false);
    setShowProcessor(true);
  };

  const handleAddCard = () => {
    setShowSelector(false);
    router.push('/(app)/payment/add-card');
  };

  const handlePaymentSuccess = (transactionId: string) => {
    setShowProcessor(false);
    Alert.alert('Успіх', `Платіж успішно оброблено! ID: ${transactionId}`);
  };

  const handlePaymentError = (error: string) => {
    Alert.alert('Помилка', error);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Тест Платежів</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Тестування системи оплати</Text>
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => setShowSelector(true)}
        >
          <Ionicons name="card" size={24} color={Colors.primary} />
          <Text style={styles.testButtonText}>Тестувати платіж</Text>
        </TouchableOpacity>

        <Text style={styles.infoText}>
          Натисніть щоб відкрити вибір платіжного методу та протестувати повний flow оплати
        </Text>

        {selectedMethod && (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedText}>
              Обрано: {selectedMethod.display_name}
            </Text>
            {selectedMethod.is_default && (
              <Text style={styles.defaultText}>За замовчуванням</Text>
            )}
          </View>
        )}
      </View>

      {/* Payment Method Selector Modal */}
      <PaymentMethodSelector
        visible={showSelector}
        onClose={() => setShowSelector(false)}
        onSelect={handleSelectMethod}
        onAddCard={handleAddCard}
        selectedMethodId={selectedMethod?.id}
      />

      {/* Payment Processor Modal */}
      <PaymentProcessor
        visible={showProcessor}
        rideId="test-ride-123"
        paymentMethod={selectedMethod!}
        amount={150.00}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        onClose={() => setShowProcessor(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
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
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 24,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    marginBottom: 16,
  },
  testButtonText: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  infoText: {
    fontSize: 14,
    color: Colors.grayText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  selectedInfo: {
    padding: 16,
    backgroundColor: '#6B38FB10',
    borderRadius: 12,
  },
  selectedText: {
    fontSize: 14,
    color: Colors.black,
    marginBottom: 4,
  },
  defaultText: {
    fontSize: 12,
    color: Colors.grayText,
  },
});
