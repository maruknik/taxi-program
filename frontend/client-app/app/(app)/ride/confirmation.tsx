import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors } from '@/src/constants/theme';
import { useRideStore } from '@/src/store/useRideStore';
import { useCreateRide } from '@/src/hooks/useCreateRide';
import { getDrivingRouteData } from '@/src/services/placesService';
import { RIDE_TYPES } from '@/src/constants/rideTypes';

export default function RideConfirmationScreen() {
  const router = useRouter();
  const {
    pickupLocation,
    dropoffLocation,
    waypointLocations,
    selectedRideType,
    priceEstimates,
  } = useRideStore();

  const createRide = useCreateRide();
  const [routeCoordinates, setRouteCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      loadRoute();
    }
  }, [pickupLocation, dropoffLocation, waypointLocations]);

  const loadRoute = async () => {
    if (!pickupLocation || !dropoffLocation) return;

    try {
      const routeData = await getDrivingRouteData(
        {
          latitude: pickupLocation.latitude,
          longitude: pickupLocation.longitude,
        },
        {
          latitude: dropoffLocation.latitude,
          longitude: dropoffLocation.longitude,
        },
        waypointLocations
          .filter(Boolean)
          .map((location) => ({
            latitude: location!.latitude,
            longitude: location!.longitude,
          })),
      );

      setRouteCoordinates(routeData.coordinates);
    } catch (error) {
      console.error('Failed to load route:', error);
    }
  };

  const handleConfirm = async () => {
    if (!pickupLocation || !dropoffLocation || !selectedRideType) {
      Alert.alert('Помилка', 'Не всі дані для замовлення заповнені');
      return;
    }

    try {
      await createRide.mutateAsync({
        pickup_lat: pickupLocation.latitude,
        pickup_lon: pickupLocation.longitude,
        dropoff_lat: dropoffLocation.latitude,
        dropoff_lon: dropoffLocation.longitude,
        pickup_address: pickupLocation.address,
        dropoff_address: dropoffLocation.address,
        vehicle_type: selectedRideType,
      });

      router.push('/(app)/ride/searching');
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося створити замовлення');
    }
  };

  const selectedEstimate = priceEstimates?.find(
    estimate => estimate.vehicle_type === selectedRideType
  );
  const selectedRideTypeInfo = RIDE_TYPES.find(type => type.id === selectedRideType);

  
  if (!pickupLocation || !dropoffLocation || !selectedRideType) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Помилка: не всі дані заповнені</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Повернутися назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: (pickupLocation.latitude + dropoffLocation.latitude) / 2,
            longitude: (pickupLocation.longitude + dropoffLocation.longitude) / 2,
            latitudeDelta: Math.abs(pickupLocation.latitude - dropoffLocation.latitude) * 1.5,
            longitudeDelta: Math.abs(pickupLocation.longitude - dropoffLocation.longitude) * 1.5,
          }}
        >
          {/* Route Polyline */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={Colors.primary}
              strokeWidth={4}
            />
          )}

          {/* Pickup Marker */}
          <Marker
            coordinate={{
              latitude: pickupLocation.latitude,
              longitude: pickupLocation.longitude,
            }}
            title="Відправлення"
            description={pickupLocation.address}
          >
            <View style={styles.pickupMarker}>
              <Ionicons name="location" size={24} color={Colors.white} />
            </View>
          </Marker>

          {/* Waypoint Markers */}
          {waypointLocations.map((waypoint, index) =>
            waypoint ? (
              <Marker
                key={`waypoint-${index}`}
                coordinate={{
                  latitude: waypoint.latitude,
                  longitude: waypoint.longitude,
                }}
                title={`Проміжна точка ${index + 1}`}
                description={waypoint.address}
              >
                <View style={styles.waypointMarker}>
                  <Text style={styles.waypointNumber}>{index + 1}</Text>
                </View>
              </Marker>
            ) : null
          )}

          {/* Dropoff Marker */}
          <Marker
            coordinate={{
              latitude: dropoffLocation.latitude,
              longitude: dropoffLocation.longitude,
            }}
            title="Призначення"
            description={dropoffLocation.address}
          >
            <View style={styles.dropoffMarker}>
              <Ionicons name="location" size={24} color={Colors.black} />
            </View>
          </Marker>
        </MapView>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
      </View>

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        <View style={styles.addressContainer}>
          <Text style={styles.addressText}>{dropoffLocation.address}</Text>
          <Text style={styles.rideTypeText}>
            {selectedRideTypeInfo?.name} {selectedEstimate?.estimated_price}₴
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            createRide.isPending && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={createRide.isPending}
        >
          <Text style={styles.confirmButtonText}>
            {createRide.isPending ? 'Створюємо замовлення...' : 'Підтвердити замовлення'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  // Map
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  // Markers
  pickupMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  dropoffMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.black,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  waypointMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.grayText,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  waypointNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.grayText,
  },

  // Bottom Card
  bottomCard: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  addressContainer: {
    marginBottom: 20,
  },
  addressText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  rideTypeText: {
    fontSize: 14,
    color: Colors.grayText,
  },

  // Confirm Button
  confirmButton: {
    paddingVertical: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.grayText,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
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
});
