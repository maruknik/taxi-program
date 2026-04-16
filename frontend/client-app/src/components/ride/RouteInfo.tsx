import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { LocationWithAddress } from '@/src/types';

interface RouteInfoProps {
  pickupLocation: LocationWithAddress;
  dropoffLocation: LocationWithAddress;
  waypointLocations?: (LocationWithAddress | null)[];
  showIcons?: boolean;
}

export function RouteInfo({ 
  pickupLocation, 
  dropoffLocation, 
  waypointLocations = [],
  showIcons = true 
}: RouteInfoProps) {
  return (
    <View style={styles.container}>
      {/* Pickup */}
      <View style={styles.locationRow}>
        {showIcons && (
          <View style={styles.iconContainer}>
            <View style={styles.pickupDot} />
          </View>
        )}
        <Text style={styles.addressText} numberOfLines={1}>
          {pickupLocation.address}
        </Text>
      </View>

      {/* Waypoints */}
      {waypointLocations.map((waypoint, index) =>
        waypoint ? (
          <View key={`waypoint-${index}`} style={styles.locationRow}>
            {showIcons && (
              <View style={styles.iconContainer}>
                <View style={styles.waypointDot}>
                  <Text style={styles.waypointNumber}>{index + 1}</Text>
                </View>
              </View>
            )}
            <Text style={styles.addressText} numberOfLines={1}>
              {waypoint.address}
            </Text>
          </View>
        ) : null
      )}

      {/* Dropoff */}
      <View style={styles.locationRow}>
        {showIcons && (
          <View style={styles.iconContainer}>
            <View style={styles.dropoffDot} />
          </View>
        )}
        <Text style={styles.addressText} numberOfLines={1}>
          {dropoffLocation.address}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.black,
  },
  waypointDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.grayText,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waypointNumber: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.grayText,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: Colors.black,
  },
});
