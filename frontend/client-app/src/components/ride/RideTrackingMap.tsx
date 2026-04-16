import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { LocationWithAddress } from '@/src/types';
import { DriverMarker } from './DriverMarker';
import { DriverRoutePolyline } from './DriverRoutePolyline';
import { getDrivingRouteCoordinates } from '@/src/services/placesService';

interface RideTrackingMapProps {
  pickupLocation: LocationWithAddress;
  dropoffLocation: LocationWithAddress;
  waypointLocations?: (LocationWithAddress | null)[];
  driverLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  } | null;
  rideStatus: string;
  onCenterOnDriver?: () => void;
  onCenterOnRoute?: () => void;
}

export function RideTrackingMap({
  pickupLocation,
  dropoffLocation,
  waypointLocations = [],
  driverLocation,
  rideStatus,
  onCenterOnDriver,
  onCenterOnRoute,
}: RideTrackingMapProps) {
  const mapRef = useRef<MapView>(null);
  const [fullRouteCoordinates, setFullRouteCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  // Завантажити повний маршрут поїздки
  useEffect(() => {
    loadFullRoute();
  }, [pickupLocation, dropoffLocation, waypointLocations]);

  const loadFullRoute = async () => {
    try {
      const coordinates = await getDrivingRouteCoordinates(
        pickupLocation,
        dropoffLocation,
        waypointLocations.filter(Boolean) as LocationWithAddress[]
      );
      setFullRouteCoordinates(coordinates);
    } catch (error) {
      console.error('Failed to load full route:', error);
    }
  };

  const handleCenterOnDriver = () => {
    if (driverLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...driverLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      onCenterOnDriver?.();
    }
  };

  const handleCenterOnRoute = () => {
    if (mapRef.current) {
      const coordinates = [];
      
      // Додати всі точки маршруту
      coordinates.push(pickupLocation);
      waypointLocations.forEach(waypoint => {
        if (waypoint) coordinates.push(waypoint);
      });
      coordinates.push(dropoffLocation);
      
      // Додати локацію водія якщо є
      if (driverLocation) {
        coordinates.push(driverLocation);
      }

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
      onCenterOnRoute?.();
    }
  };

  // Визначити destination залежно від статусу
  const currentDestination = rideStatus === 'accepted' ? pickupLocation : dropoffLocation;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: (pickupLocation.latitude + dropoffLocation.latitude) / 2,
          longitude: (pickupLocation.longitude + dropoffLocation.longitude) / 2,
          latitudeDelta: Math.abs(pickupLocation.latitude - dropoffLocation.latitude) * 1.5,
          longitudeDelta: Math.abs(pickupLocation.longitude - dropoffLocation.longitude) * 1.5,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsTraffic={true}
      >
        {/* Повний маршрут поїздки (сірий) */}
        {fullRouteCoordinates.length > 0 && (
          <Polyline
            coordinates={fullRouteCoordinates}
            strokeColor={Colors.lightGray}
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}

        {/* Маршрут від водія до поточного destination (фіолетовий) */}
        {driverLocation && currentDestination && (
          <DriverRoutePolyline
            driverLocation={driverLocation}
            destination={currentDestination}
            strokeColor={Colors.primary}
            strokeWidth={4}
          />
        )}

        {/* Маркер pickup */}
        <Marker
          coordinate={pickupLocation}
          title="Точка посадки"
          description={pickupLocation.address}
        >
          <View style={[
            styles.locationMarker,
            { backgroundColor: rideStatus === 'accepted' ? Colors.primary : Colors.lightGray }
          ]}>
            <Ionicons name="location" size={20} color={Colors.white} />
          </View>
        </Marker>

        {/* Маркери waypoints */}
        {waypointLocations.map((waypoint, index) =>
          waypoint ? (
            <Marker
              key={`waypoint-${index}`}
              coordinate={waypoint}
              title={`Проміжна точка ${index + 1}`}
              description={waypoint.address}
            >
              <View style={styles.waypointMarker}>
                <Text style={styles.waypointNumber}>{index + 1}</Text>
              </View>
            </Marker>
          ) : null
        )}

        {/* Маркер dropoff */}
        <Marker
          coordinate={dropoffLocation}
          title="Призначення"
          description={dropoffLocation.address}
        >
          <View style={[
            styles.locationMarker,
            styles.dropoffMarker,
            { 
              backgroundColor: rideStatus === 'in_progress' ? Colors.success : Colors.white,
              borderColor: rideStatus === 'in_progress' ? Colors.success : Colors.black,
            }
          ]}>
            <Ionicons 
              name="location" 
              size={20} 
              color={rideStatus === 'in_progress' ? Colors.white : Colors.black} 
            />
          </View>
        </Marker>

        {/* Маркер водія */}
        {driverLocation && (
          <DriverMarker
            coordinate={driverLocation}
            heading={driverLocation.heading}
            speed={driverLocation.speed}
          />
        )}
      </MapView>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleCenterOnDriver}
          disabled={!driverLocation}
        >
          <Ionicons 
            name="car" 
            size={20} 
            color={driverLocation ? Colors.black : Colors.grayText} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleCenterOnRoute}
        >
          <Ionicons name="map" size={20} color={Colors.black} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },

  // Markers
  locationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  dropoffMarker: {
    borderWidth: 2,
  },
  waypointMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
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

  // Controls
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
  },
  controlButton: {
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
  },
});
