import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors } from '@/src/constants/theme';
import { PasswordStrength } from '@/src/types/security.types';

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength | null;
}

export function PasswordStrengthIndicator({ strength }: PasswordStrengthIndicatorProps) {
  if (!strength) return null;

  const getStrengthColor = () => {
    switch (strength.strength) {
      case 'strong': return Colors.success;
      case 'medium': return Colors.warning;
      case 'weak': return Colors.error;
      default: return Colors.grayText;
    }
  };

  const getStrengthText = () => {
    switch (strength.strength) {
      case 'strong': return 'Надійний пароль';
      case 'medium': return 'Середній пароль';
      case 'weak': return 'Слабкий пароль';
      default: return '';
    }
  };

  const getStrengthWidth = () => {
    return Math.min((strength.score / 8) * 100, 100);
  };

  return (
    <View style={styles.container}>
      {/* Strength Bar */}
      <View style={styles.strengthBar}>
        <View 
          style={[
            styles.strengthFill, 
            { 
              width: getStrengthWidth(),
              backgroundColor: getStrengthColor() 
            }
          ]} 
        />
      </View>

      {/* Strength Text */}
      <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
        {getStrengthText()}
      </Text>

      {/* Errors */}
      {strength.errors.map((error, index) => (
        <Text key={index} style={styles.errorText}>
          • {error}
        </Text>
      ))}

      {/* Warnings */}
      {strength.warnings.map((warning, index) => (
        <Text key={index} style={styles.warningText}>
          • {warning}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 11,
    color: Colors.error,
    marginBottom: 2,
  },
  warningText: {
    fontSize: 11,
    color: Colors.warning,
    marginBottom: 2,
  },
});
