import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';

interface ETABadgeProps {
  eta: number | null;
  isCalculating?: boolean;
  trafficCondition?: 'light' | 'moderate' | 'heavy' | 'unknown';
  trafficColor?: string;
  trafficText?: string;
  lastUpdate?: Date | null;
  onPress?: () => void;
  style?: any;
}

export function ETABadge({ 
  eta, 
  isCalculating = false, 
  trafficCondition = 'unknown',
  trafficColor = Colors.primary,
  trafficText = '',
  lastUpdate,
  onPress,
  style 
}: ETABadgeProps) {
  const getETAText = () => {
    if (isCalculating) return 'Розраховуємо...';
    if (eta === null) return 'Невідомо';
    if (eta < 1) return '< 1 хв';
    return `${eta} хв`;
  };

  const getTrafficIcon = () => {
    switch (trafficCondition) {
      case 'light': return 'speedometer-outline';
      case 'moderate': return 'warning-outline';
      case 'heavy': return 'alert-circle-outline';
      default: return 'time-outline';
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}с тому`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}хв тому`;
    return lastUpdate.toLocaleTimeString('uk-UA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component 
      style={[styles.container, { backgroundColor: trafficColor }, style]}
      onPress={onPress}
    >
      <View style={styles.mainContent}>
        <Ionicons 
          name={getTrafficIcon() as any} 
          size={16} 
          color={Colors.white} 
        />
        <Text style={styles.etaText}>{getETAText()}</Text>
        {isCalculating && (
          <View style={styles.loadingIndicator}>
            <Ionicons name="refresh" size={12} color={Colors.white} />
          </View>
        )}
      </View>
      
      {trafficText && (
        <Text style={styles.trafficText}>{trafficText}</Text>
      )}
      
      {lastUpdate && (
        <Text style={styles.updateText}>
          Оновлено {formatLastUpdate()}
        </Text>
      )}
    </Component>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 80,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  loadingIndicator: {
    marginLeft: 4,
  },
  trafficText: {
    fontSize: 10,
    color: Colors.white,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.9,
  },
  updateText: {
    fontSize: 9,
    color: Colors.white,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.7,
  },
});
