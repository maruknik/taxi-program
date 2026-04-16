import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';

interface ConnectionStatusIndicatorProps {
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  error?: string | null;
  onRetry?: () => void;
}

export function ConnectionStatusIndicator({ 
  connectionState, 
  error, 
  onRetry 
}: ConnectionStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (connectionState) {
      case 'connected':
        return {
          icon: 'wifi' as const,
          text: 'Підключено',
          color: Colors.success,
          show: false, // Не показувати коли все добре
        };
      case 'connecting':
        return {
          icon: 'wifi-outline' as const,
          text: 'Підключення...',
          color: Colors.warning,
          show: true,
        };
      case 'error':
        return {
          icon: 'wifi-outline' as const,
          text: error || 'Помилка з\'єднання',
          color: Colors.error,
          show: true,
        };
      case 'disconnected':
      default:
        return {
          icon: 'wifi-outline' as const,
          text: 'Немає з\'єднання',
          color: Colors.error,
          show: true,
        };
    }
  };

  const config = getStatusConfig();

  if (!config.show) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: config.color }]}
      onPress={onRetry}
      disabled={connectionState === 'connecting'}
    >
      <Ionicons name={config.icon} size={16} color={Colors.white} />
      <Text style={styles.text}>{config.text}</Text>
      {onRetry && connectionState !== 'connecting' && (
        <Ionicons name="refresh" size={14} color={Colors.white} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    marginLeft: 6,
    marginRight: 4,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.white,
  },
});
