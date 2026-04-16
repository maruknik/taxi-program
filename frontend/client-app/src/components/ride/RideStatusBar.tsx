import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';

interface RideStatusBarProps {
  status: 'accepted' | 'in_progress' | 'completed';
  driverName: string;
  eta?: number;
}

export function RideStatusBar({ status, driverName, eta }: RideStatusBarProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'accepted':
        return {
          icon: 'time' as const,
          text: `${driverName} прямує до вас`,
          subtext: eta ? `Прибуття через ${eta} хв` : 'Розраховуємо час прибуття...',
          color: Colors.primary,
        };
      case 'in_progress':
        return {
          icon: 'car' as const,
          text: 'Поїздка розпочата',
          subtext: `${driverName} везе вас до місця призначення`,
          color: Colors.success,
        };
      case 'completed':
        return {
          icon: 'checkmark-circle' as const,
          text: 'Поїздка завершена',
          subtext: 'Дякуємо за поїздку!',
          color: Colors.success,
        };
      default:
        return {
          icon: 'help' as const,
          text: 'Невідомий статус',
          subtext: '',
          color: Colors.grayText,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: statusInfo.color }]}>
        <Ionicons name={statusInfo.icon} size={20} color={Colors.white} />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.statusText}>{statusInfo.text}</Text>
        <Text style={styles.subtextText}>{statusInfo.subtext}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  subtextText: {
    fontSize: 12,
    color: Colors.grayText,
  },
});