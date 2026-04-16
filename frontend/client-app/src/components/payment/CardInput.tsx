import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';

interface CardInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  maxLength?: number;
  keyboardType?: 'default' | 'numeric';
  secureTextEntry?: boolean;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  showCardType?: boolean;
}

export const CardInput = React.forwardRef<TextInput, CardInputProps>(({
  value,
  onChangeText,
  placeholder,
  error,
  maxLength,
  keyboardType = 'default',
  secureTextEntry = false,
  autoFocus = false,
  onSubmitEditing,
  showCardType = false,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Анімація помилки
  React.useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  const getCardType = (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'visa';
    if (cleaned.startsWith('5') || cleaned.startsWith('2')) return 'mastercard';
    if (cleaned.startsWith('3')) return 'amex';
    return '';
  };

  const formatCardNumber = (text: string): string => {
    const cleaned = text.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(' ').substr(0, 19); // Max 16 digits + 3 spaces
  };

  const handleTextChange = (text: string) => {
    if (placeholder.includes('Номер картки')) {
      const formatted = formatCardNumber(text);
      onChangeText(formatted);
    } else {
      onChangeText(text);
    }
  };

  const cardType = showCardType ? getCardType(value) : '';

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
          { transform: [{ translateX: shakeAnimation }] },
        ]}
      >
        <TextInput
          ref={ref}
          style={styles.input}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.grayText}
          maxLength={maxLength}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoFocus={autoFocus}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="next"
        />
        
        {showCardType && cardType && (
          <View style={styles.cardTypeContainer}>
            <Ionicons
              name={cardType === 'visa' ? 'card' : 'card'}
              size={24}
              color={Colors.primary}
            />
            <Text style={styles.cardTypeText}>
              {cardType.toUpperCase()}
            </Text>
          </View>
        )}
      </Animated.View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  inputContainerFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
  },
  cardTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  cardTypeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.error,
  },
});
