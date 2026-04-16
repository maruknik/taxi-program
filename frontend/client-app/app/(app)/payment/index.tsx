import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { PaymentMethodSelector } from '@/src/components/payment/PaymentMethodSelector';
import { PaymentMethod } from '@/src/types/payment.types';

export default function PaymentScreen() {
  const router = useRouter();
  const [showSelector, setShowSelector] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setShowSelector(false);
  };

  const handleAddCard = () => {
    setShowSelector(false);
    router.push('/(app)/payment/add-card');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Спосіб оплати</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Оберіть спосіб оплати</Text>
        
        <TouchableOpacity
          style={styles.paymentOption}
          onPress={() => setShowSelector(true)}
        >
          <View style={styles.paymentInfo}>
            <Ionicons 
              name={selectedMethod?.type === 'cash' ? 'cash-outline' : 'card-outline'} 
              size={24} 
              color={Colors.primary} 
            />
            <Text style={styles.paymentText}>
              {selectedMethod ? selectedMethod.display_name : 'Оберіть спосіб оплати'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.grayText} />
        </TouchableOpacity>

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
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    marginLeft: 12,
    fontSize: 16,
    color: Colors.black,
  },
  selectedInfo: {
    marginTop: 16,
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
