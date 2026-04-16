import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { PaymentMethod } from '@/src/types/payment.types';
import { useProcessRidePayment, useConfirmPayment, useTransactionStatus, PaymentIntent, Transaction } from '@/src/hooks/usePaymentProcessing';

interface PaymentProcessorProps {
  visible: boolean;
  rideId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export function PaymentProcessor({
  visible,
  rideId,
  paymentMethod,
  amount,
  onSuccess,
  onError,
  onClose,
}: PaymentProcessorProps) {
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [currentStep, setCurrentStep] = useState<'processing' | 'confirming' | 'completed' | 'failed'>('processing');

  const processPayment = useProcessRidePayment();
  const confirmPayment = useConfirmPayment();
  const { data: transactionStatus } = useTransactionStatus(paymentIntent?.payment_id || null);

  useEffect(() => {
    if (visible && rideId && paymentMethod) {
      initiatePayment();
    }
  }, [visible, rideId, paymentMethod]);

  useEffect(() => {
    if (transactionStatus) {
      handleTransactionStatusUpdate(transactionStatus);
    }
  }, [transactionStatus]);

  const initiatePayment = async () => {
    try {
      setCurrentStep('processing');
      
      const intent = await processPayment.mutateAsync({
        ride_id: rideId,
        payment_method_id: paymentMethod.id,
        amount: amount,
      });

      setPaymentIntent(intent);

      // Handle different payment methods
      if (paymentMethod.type === 'cash') {
        // Cash payments are completed immediately
        setCurrentStep('completed');
        setTimeout(() => {
          onSuccess(intent.payment_id);
        }, 1500);
      } else {
        // Card payments require confirmation
        setCurrentStep('confirming');
        await handleCardPayment(intent);
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);
      setCurrentStep('failed');
      onError(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  const handleCardPayment = async (intent: PaymentIntent) => {
    try {
      if (intent.requires_confirmation) {
        // For real implementation, here you would:
        // 1. Open payment gateway (LiqPay, Stripe, etc.)
        // 2. Handle 3D Secure authentication
        // 3. Wait for payment confirmation
        
        // Mock confirmation for development
        setTimeout(async () => {
          try {
            const result = await confirmPayment.mutateAsync(intent.payment_id);
            
            if (result.status === 'completed') {
              setCurrentStep('completed');
              setTimeout(() => {
                onSuccess(intent.payment_id);
              }, 1500);
            } else {
              setCurrentStep('failed');
              onError(result.error_message || 'Payment failed');
            }
          } catch (error) {
            setCurrentStep('failed');
            onError(error instanceof Error ? error.message : 'Payment confirmation failed');
          }
        }, 3000); // Simulate processing time
      }
    } catch (error) {
      setCurrentStep('failed');
      onError(error instanceof Error ? error.message : 'Card payment failed');
    }
  };

  const handleTransactionStatusUpdate = (transaction: Transaction | undefined) => {
    if (!transaction) return;
    
    switch (transaction.status) {
      case 'completed':
        setCurrentStep('completed');
        setTimeout(() => {
          onSuccess(transaction.id);
        }, 1500);
        break;
      case 'failed':
        setCurrentStep('failed');
        onError(transaction.error_message || 'Payment failed');
        break;
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 'processing':
        return {
          icon: 'card',
          title: 'Обробка платежу',
          description: 'Ініціюємо платіж...',
          showSpinner: true,
        };
      case 'confirming':
        return {
          icon: 'shield-checkmark',
          title: 'Підтвердження платежу',
          description: paymentMethod.type === 'card' 
            ? 'Підтверджуємо платіж з банком...' 
            : 'Обробляємо платіж...',
          showSpinner: true,
        };
      case 'completed':
        return {
          icon: 'checkmark-circle',
          title: 'Платіж успішний',
          description: `Сплачено ${amount} ₴`,
          showSpinner: false,
        };
      case 'failed':
        return {
          icon: 'close-circle',
          title: 'Помилка платежу',
          description: 'Не вдалося обробити платіж',
          showSpinner: false,
        };
    }
  };

  const content = getStepContent();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={currentStep === 'failed' ? onClose : undefined}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            {content.showSpinner ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : (
              <Ionicons
                name={content.icon as any}
                size={64}
                color={
                  currentStep === 'completed' 
                    ? Colors.success 
                    : currentStep === 'failed' 
                    ? Colors.error 
                    : Colors.primary
                }
              />
            )}
          </View>

          {/* Content */}
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.description}>{content.description}</Text>

          {/* Payment Method Info */}
          <View style={styles.paymentInfo}>
            <Ionicons
              name={paymentMethod.type === 'cash' ? 'cash' : 'card'}
              size={20}
              color={Colors.grayText}
            />
            <Text style={styles.paymentText}>
              {paymentMethod.display_name} • {amount} ₴
            </Text>
          </View>

          {/* Action Button */}
          {currentStep === 'failed' && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.retryButton} onPress={initiatePayment}>
                <Text style={styles.retryButtonText}>Спробувати ще раз</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Скасувати</Text>
              </TouchableOpacity>
            </View>
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
    paddingVertical: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },

  // Icon
  iconContainer: {
    marginBottom: 24,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: Colors.grayText,
    textAlign: 'center',
    marginBottom: 24,
  },

  // Payment Info
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    marginBottom: 24,
  },
  paymentText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.black,
  },

  // Buttons
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    paddingVertical: 14,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
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
  },
});
