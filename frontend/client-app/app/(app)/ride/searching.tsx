import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { useRideStore } from '@/src/store/useRideStore';
import { useCancelRide } from '@/src/hooks/useCancelRide';

export default function DriverSearchingScreen() {
  const router = useRouter();
  const {
    currentRideId,
    pickupLocation,
    dropoffLocation,
    selectedRideType,
    rideStatus,
  } = useRideStore();

  const cancelRide = useCancelRide();
  const [searchTime, setSearchTime] = useState(0);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setSearchTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  useEffect(() => {
    // Listen for ride status changes
    if (currentRideId) {
      const checkRideStatus = async () => {
        try {
          const apiClient = (await import('@/src/lib/api')).apiClient;
          const response = await apiClient.get(`/rides/${currentRideId}/status/`);
          
          const status = response.data?.status;
          
          if (status === 'accepted' || status === 'in_progress' || status === 'driver_arrived') {
            router.replace('/(app)/ride/tracking');
          }
        } catch (error) {
          console.error('Error checking ride status:', error);
        }
      };

      // Check status every 2 seconds
      const statusInterval = setInterval(checkRideStatus, 2000);

      return () => clearInterval(statusInterval);
    }
  }, [currentRideId, router]);

  const handleCancel = () => {
    Alert.alert(
      'Скасувати поїздку?',
      'Ви впевнені що хочете скасувати замовлення?',
      [
        { text: 'Ні', style: 'cancel' },
        {
          text: 'Так, скасувати',
          style: 'destructive',
          onPress: async () => {
            if (currentRideId) {
              try {
                await cancelRide.mutateAsync(currentRideId);
                router.replace('/(app)/main');
              } catch (error) {
                Alert.alert('Помилка', 'Не вдалося скасувати поїздку');
              }
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentRideId || !pickupLocation || !dropoffLocation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Помилка: дані поїздки відсутні</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/main')}>
          <Text style={styles.backText}>Повернутися на головний</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={cancelRide.isPending}
        >
          <Text style={styles.cancelButtonText}>
            {cancelRide.isPending ? 'Скасування...' : 'Скасувати'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Animated Car Icon */}
        <Animated.View style={[styles.carContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.carCircle}>
            <Ionicons name="car" size={60} color={Colors.primary} />
          </View>
        </Animated.View>

        {/* Searching Text */}
        <Text style={styles.searchingText}>Шукаємо водія...</Text>
        <Text style={styles.timeText}>{formatTime(searchTime)}</Text>

        {/* Location Info */}
        <View style={styles.locationContainer}>
          <View style={styles.locationRow}>
            <View style={styles.dot} />
            <Text style={styles.locationText} numberOfLines={1}>
              {pickupLocation.address}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <View style={[styles.dot, styles.dropoffDot]} />
            <Text style={styles.locationText} numberOfLines={1}>
              {dropoffLocation.address}
            </Text>
          </View>
        </View>

        {/* Ride Type Info */}
        <View style={styles.rideTypeInfo}>
          <Text style={styles.rideTypeText}>
            {selectedRideType === 'economy' ? 'Економ' : 
             selectedRideType === 'comfort' ? 'Стандарт' : 'Бізнес'}
          </Text>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Порада:</Text>
        <Text style={styles.tipsText}>
          Водій побачить ваше замовлення і прийме його найближчим часом
        </Text>
      </View>
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
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  carContainer: {
    marginBottom: 32,
  },
  carCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  searchingText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 18,
    color: Colors.grayText,
    marginBottom: 32,
  },
  locationContainer: {
    width: '100%',
    marginBottom: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    marginRight: 12,
  },
  dropoffDot: {
    backgroundColor: Colors.black,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: Colors.black,
  },
  rideTypeInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 20,
  },
  rideTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
  },
  tipsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 14,
    color: Colors.grayText,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    color: Colors.primary,
    textAlign: 'center',
  },
});
