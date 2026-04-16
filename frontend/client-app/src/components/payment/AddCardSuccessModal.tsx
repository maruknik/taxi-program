import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';

interface AddCardSuccessModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export function AddCardSuccessModal({ visible, onClose }: AddCardSuccessModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Анімація появи
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(checkmarkAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      checkmarkAnim.setValue(0);
    }
  }, [visible]);

  const checkmarkScale = checkmarkAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Card Icon with Animation */}
          <View style={styles.iconContainer}>
            <View style={styles.cardIcon}>
              <Ionicons name="card" size={48} color={Colors.primary} />
              
              <Animated.View
                style={[
                  styles.checkmarkContainer,
                  {
                    transform: [{ scale: checkmarkScale }],
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
              </Animated.View>
            </View>
          </View>

          {/* Success Text */}
          <Text style={styles.title}>Картку додано</Text>
          <Text style={styles.description}>
            Для перевірки картки ваш банк може тимчасово 
            утримувати невелику суму на рахунку. Кошти незабаром 
            повернуться на рахунок.{' '}
            <Text style={styles.learnMoreText}>Дізнатись більше</Text>
          </Text>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Добре</Text>
          </TouchableOpacity>
        </Animated.View>
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
    width: screenWidth - 40,
    maxWidth: 400,
    alignItems: 'center',
  },

  // Icon
  iconContainer: {
    marginBottom: 24,
  },
  cardIcon: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkContainer: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: Colors.white,
    borderRadius: 16,
  },

  // Text
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: Colors.grayText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  learnMoreText: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },

  // Button
  closeButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minWidth: 120,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
  },
});
