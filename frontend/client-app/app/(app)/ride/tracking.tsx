import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { useRideStore } from '@/src/store/useRideStore';
import { useRideWebSocket } from '@/src/hooks/useWebSocket';
import { useRideStatus } from '@/src/hooks/useRideStatus';
import { useAdvancedETA } from '@/src/hooks/useAdvancedETA';
import { RideTrackingMap } from '@/src/components/ride/RideTrackingMap';
import { ETABadge } from '@/src/components/ride/ETABadge';
import { ConnectionStatusIndicator } from '@/src/components/ride/ConnectionStatusIndicator';
import { DriverFoundCard } from '@/src/components/ride/DriverFoundCard';
import { RideDetailsCard } from '@/src/components/ride/RideDetailsCard';
import { RideStatusBar } from '@/src/components/ride/RideStatusBar';
import { useRideDetails } from '@/src/hooks/useRideDetails';

export default function RideTrackingScreen() {
  const router = useRouter();
  const {
    currentRideId,
    pickupLocation,
    dropoffLocation,
    waypointLocations,
    driverLocation,
    wsConnectionState,
    wsError,
    currentRideData,
    selectedRideType,
    priceEstimates,
  } = useRideStore();

  // WebSocket connection
  const { 
    isConnected, 
    reconnect 
  } = useRideWebSocket(currentRideId);

  // Fallback polling якщо WebSocket не працює
  const { data: rideStatusData } = useRideStatus(currentRideId);

  // Повні дані поїздки (включно з driver_info) — fallback коли WS не передав водія
  const { data: rideDetails } = useRideDetails(currentRideId);

  const [showDetails, setShowDetails] = useState(false);

  // Advanced ETA calculation
  const destination = currentRideData?.status === 'accepted' ? pickupLocation : dropoffLocation;
  
  const { 
    etaData,
    eta, 
    isCalculating, 
    trafficColor,
    trafficText,
    lastUpdate,
    forceUpdate 
  } = useAdvancedETA({
    rideId: currentRideId,
    destination,
    rideStatus: currentRideData?.status || rideStatusData?.status || 'idle',
  });

  // Навігація при зміні статусу
  useEffect(() => {
    const status = currentRideData?.status || rideStatusData?.status;
    
    if (status === 'completed') {
      router.replace('/ride/rating');
    } else if (status === 'cancelled') {
      Alert.alert('Поїздка скасована', 'Ваша поїздка була скасована');
      router.replace('/main');
    }
  }, [currentRideData?.status, rideStatusData?.status]);

  const handleCall = () => {
    const phone = currentRideData?.driver?.phone || '+380501234567';
    Alert.alert(
      'Зателефонувати водію?',
      `Номер: ${phone}`,
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Зателефонувати',
          onPress: () => Linking.openURL(`tel:${phone}`),
        },
      ]
    );
  };

  const handleMessage = () => {
    Alert.alert('Повідомлення', 'Функція повідомлень буде додана пізніше');
  };

  const selectedEstimate = priceEstimates?.find(
    estimate => estimate.vehicle_type === selectedRideType
  );

  if (!pickupLocation || !dropoffLocation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Помилка: дані поїздки не знайдені</Text>
        <TouchableOpacity onPress={() => router.replace('/main')}>
          <Text style={styles.backText}>Повернутися на головну</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const rideStatus = currentRideData?.status || rideStatusData?.status || 'unknown';

  // Дані водія: спочатку з WS, якщо немає — з REST /detail/
  const wsDriver = currentRideData?.driver;
  const restDriverInfo = (rideDetails as any)?.driver_info;
  // RideSerializer повертає vehicle як рядок ("Toyota Camry"), plate — окремо
  const driver = wsDriver ?? (restDriverInfo ? {
    id: restDriverInfo.id,
    name: restDriverInfo.name,
    rating: restDriverInfo.rating ?? 5.0,
    total_rides: restDriverInfo.total_rides,
    phone: restDriverInfo.phone,
    vehicle: typeof restDriverInfo.vehicle === 'string'
      ? { make: restDriverInfo.vehicle, model: '', color: '', plate: restDriverInfo.plate ?? '' }
      : {
          make: restDriverInfo.vehicle?.make ?? '',
          model: restDriverInfo.vehicle?.model ?? '',
          color: restDriverInfo.vehicle?.color ?? '',
          plate: restDriverInfo.vehicle?.plate ?? restDriverInfo.plate ?? '',
        },
  } : null);

  // driverLocation: з WS-стору або з polling /status/
  const effectiveDriverLocation = driverLocation ?? (
    rideStatusData?.driver_location
      ? { latitude: rideStatusData.driver_location.latitude, longitude: rideStatusData.driver_location.longitude }
      : null
  );

  // ETA: з useAdvancedETA або з polling estimated_arrival
  const effectiveEta = eta ?? rideStatusData?.estimated_arrival ?? null;

  return (
    <View style={styles.container}>
      {/* Map — fills entire screen */}
      <RideTrackingMap
        pickupLocation={pickupLocation}
        dropoffLocation={dropoffLocation}
        waypointLocations={waypointLocations}
        driverLocation={effectiveDriverLocation}
        rideStatus={rideStatus}
      />

      {/* Status Bar — absolute top */}
      <View style={styles.statusBarWrapper}>
        <RideStatusBar
          status={rideStatus as any}
          driverName={driver?.name || 'Водій'}
          eta={effectiveEta ?? undefined}
        />
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.black} />
      </TouchableOpacity>

      {/* WS indicator — only show when NOT connected AND no polling data */}
      {!isConnected && !rideStatusData && (
        <View style={styles.connectionContainer}>
          <ConnectionStatusIndicator
            connectionState={wsConnectionState}
            error={wsError}
            onRetry={reconnect}
          />
        </View>
      )}

      {/* Bottom Card — absolute bottom */}
      <View style={styles.bottomCard}>
        {driver && (rideStatus === 'accepted' || rideStatus === 'driver_arrived' || rideStatus === 'in_progress') ? (
        <DriverFoundCard
          driver={{
            id: driver.id,
            name: driver.name,
            rating: (driver as any).rating ?? 5.0,
            total_rides: (driver as any).total_rides,
            vehicle_make: driver.vehicle?.make ?? '',
            vehicle_model: driver.vehicle?.model ?? '',
            vehicle_color: driver.vehicle?.color ?? '',
            vehicle_plate: driver.vehicle?.plate ?? '',
          }}
          status={rideStatus as 'accepted' | 'driver_arrived' | 'in_progress'}
          eta={eta ?? undefined}
          onCall={handleCall}
          onMessage={handleMessage}
          onCancel={() => {
            Alert.alert('Скасувати поїздку?', 'Ви впевнені?', [
              { text: 'Ні', style: 'cancel' },
              { text: 'Так', style: 'destructive', onPress: () => router.replace('/main') },
            ]);
          }}
        />
        ) : (
          <RideDetailsCard
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            waypointLocations={waypointLocations}
            estimatedPrice={selectedEstimate?.estimated_price || 150}
            distance={selectedEstimate?.distance_km || 5.2}
            duration={selectedEstimate?.duration_minutes || 15}
            rideType={selectedRideType || 'economy'}
            paymentMethod="Готівка"
            onExpand={() => setShowDetails(!showDetails)}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  statusBarWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },

  connectionContainer: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    zIndex: 1000,
  },

  // Back Button
  backButton: {
    position: 'absolute',
    top: 100,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },

  // Error State
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

  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
});
