import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';

interface RideProgressIndicatorProps {
  currentStep: 'waiting' | 'pickup' | 'in_transit' | 'arrived';
}

export function RideProgressIndicator({ currentStep }: RideProgressIndicatorProps) {
  const steps = [
    { key: 'waiting', label: 'Очікування', icon: 'time' },
    { key: 'pickup', label: 'Посадка', icon: 'person-add' },
    { key: 'in_transit', label: 'В дорозі', icon: 'car' },
    { key: 'arrived', label: 'Прибуття', icon: 'checkmark-circle' },
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;
        const isUpcoming = index > currentStepIndex;

        return (
          <View key={step.key} style={styles.stepContainer}>
            <View style={styles.stepIndicator}>
              <View
                style={[
                  styles.stepCircle,
                  isCompleted && styles.stepCircleCompleted,
                  isActive && styles.stepCircleActive,
                  isUpcoming && styles.stepCircleUpcoming,
                ]}
              >
                <Ionicons
                  name={step.icon as any}
                  size={16}
                  color={
                    isCompleted || isActive ? Colors.white : Colors.grayText
                  }
                />
              </View>
              
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    isCompleted && styles.stepLineCompleted,
                  ]}
                />
              )}
            </View>
            
            <Text
              style={[
                styles.stepLabel,
                (isActive || isCompleted) && styles.stepLabelActive,
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },

  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },

  stepIndicator: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },

  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stepCircleCompleted: {
    backgroundColor: Colors.success,
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepCircleUpcoming: {
    backgroundColor: Colors.lightGray,
  },

  stepLine: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: -16,
    height: 2,
    backgroundColor: Colors.lightGray,
    zIndex: 0,
  },
  stepLineCompleted: {
    backgroundColor: Colors.success,
  },

  stepLabel: {
    fontSize: 12,
    color: Colors.grayText,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.black,
    fontWeight: '500',
  },
});