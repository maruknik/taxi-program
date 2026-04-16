import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';

interface ActiveRideCardProps {
  rideId: string;
  status: 'searching' | 'accepted' | 'in_progress';
  destination: string;
  driverName?: string;
  eta?: number;
}

export function ActiveRideCard({
  rideId,
  status,
  destination,
  driverName,
  eta,
}: ActiveRideCardProps) {
  const router = useRouter();

  const getStatusInfo = () => {
    switch (status) {
      case 'searching':
        return {
          icon: 'search' as const,
          title: 'Шукаємо водія',
          subtitle: 'Зазвичай це займає 1-2 хвилини',
          color: Colors.primary,
        };
      case 'accepted':
        return {
          icon: 'car' as const,
          title: `${driverName} прямує до вас`,
          subtitle: eta ? `Прибуття через ${eta} хв` : 'Розраховуємо час...',
          color: Colors.success,
        };
      case 'in_progress':
        return {
          icon: 'navigate' as const,
          title: 'Поїздка в процесі',
          subtitle: `${driverName} везе вас до призначення`,
          color: Colors.success,
        };
      default:
        return {
          icon: 'help' as const,
          title: 'Невідомий статус',
          subtitle: '',
          color: Colors.grayText,
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handlePress = () => {
    switch (status) {
      case 'searching':
        router.push('/ride/searching');
        break;
      case 'accepted':
      case 'in_progress':
        router.push('/ride/tracking');
        break;
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={[styles.statusIndicator, { backgroundColor: statusInfo.color }]}>
        <Ionicons name={statusInfo.icon} size={20} color={Colors.white} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{statusInfo.title}</Text>
        <Text style={styles.subtitle}>{statusInfo.subtitle}</Text>
        <Text style={styles.destination} numberOfLines={1}>
          До: {destination}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={Colors.grayText} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  statusIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  content: {
    flex: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },

  subtitle: {
    fontSize: 14,
    color: Colors.grayText,
    marginBottom: 4,
  },

  destination: {
    fontSize: 14,
    color: Colors.black,
  },
});