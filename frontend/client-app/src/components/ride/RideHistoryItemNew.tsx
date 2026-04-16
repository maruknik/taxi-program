import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { RideHistoryItem as RideHistoryItemType } from '@/src/hooks/useRideHistory';

interface RideHistoryItemProps {
  ride: RideHistoryItemType;
  onPress: () => void;
}

export function RideHistoryItemNew({ ride, onPress }: RideHistoryItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return `Вчора, ${date.toLocaleTimeString('uk-UA', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else if (diffDays <= 7) {
      return `${diffDays} дні тому`;
    } else {
      return date.toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return Colors.success;
      case 'cancelled': return Colors.error;
      default: return Colors.grayText;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'cancelled': return 'close-circle';
      default: return 'time';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(ride.created_at)}</Text>
        
        <View style={styles.statusContainer}>
          <Ionicons 
            name={getStatusIcon(ride.status) as any} 
            size={16} 
            color={getStatusColor(ride.status)} 
          />
          <Text style={[styles.status, { color: getStatusColor(ride.status) }]}>
            {ride.status === 'cancelled' ? 'СКАСОВАНО' : ride.status_display}
          </Text>
        </View>
      </View>

      {/* Driver Info */}
      {ride.driver_info && (
        <View style={styles.driverSection}>
          <View style={styles.driverInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {ride.driver_info.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.driverDetails}>
              <View style={styles.driverNameRow}>
                <Text style={styles.driverName}>{ride.driver_info.name}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color={Colors.warning} />
                  <Text style={styles.rating}>{ride.driver_info.rating.toFixed(1)}</Text>
                </View>
              </View>
              <Text style={styles.rideCount}>
                {ride.driver_info.total_rides} поїздок
              </Text>
            </View>
          </View>

          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>
              {ride.driver_info.vehicle.color} {ride.driver_info.vehicle.make} {ride.driver_info.vehicle.model}
            </Text>
            <Text style={styles.plateNumber}>
              {ride.driver_info.vehicle.plate}
            </Text>
          </View>
        </View>
      )}

      {/* Route */}
      <View style={styles.routeSection}>
        <View style={styles.routePoints}>
          <View style={styles.routePoint}>
            <View style={styles.pickupDot} />
            <Text style={styles.address} numberOfLines={1}>
              {ride.pickup_address}
            </Text>
          </View>
          
          <View style={styles.routeLine} />
          
          <View style={styles.routePoint}>
            <View style={styles.dropoffDot} />
            <Text style={styles.address} numberOfLines={1}>
              {ride.dropoff_address}
            </Text>
          </View>
        </View>
      </View>

      {/* Payment Info */}
      <View style={styles.paymentSection}>
        <View style={styles.paymentMethod}>
          <Ionicons 
            name={ride.payment_info.method === 'cash' ? 'cash' : 'card'} 
            size={20} 
            color={Colors.black} 
          />
          <Text style={styles.paymentText}>
            {ride.payment_info.display_name}
          </Text>
        </View>
        
        <Text style={styles.amount}>
          {Math.round(ride.payment_info.amount)}₴
        </Text>
      </View>

      {/* Trip Details */}
      <View style={styles.tripDetails}>
        <View style={styles.tripStat}>
          <Text style={styles.tripStatLabel}>Маршрут</Text>
          <Text style={styles.tripStatValue}>{ride.distance_text}</Text>
        </View>
        
        {ride.duration_text !== '—' && (
          <View style={styles.tripStat}>
            <Text style={styles.tripStatLabel}>Час</Text>
            <Text style={styles.tripStatValue}>{ride.duration_text}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  date: {
    fontSize: 14,
    color: Colors.grayText,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },

  // Driver Section
  driverSection: {
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  driverDetails: {
    flex: 1,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 2,
    fontSize: 14,
    color: Colors.black,
  },
  rideCount: {
    fontSize: 12,
    color: Colors.grayText,
    marginTop: 2,
  },
  vehicleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 52,
  },
  vehicleName: {
    fontSize: 14,
    color: Colors.black,
  },
  plateNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
  },

  // Route Section
  routeSection: {
    marginBottom: 16,
  },
  routePoints: {
    paddingLeft: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 12,
  },
  dropoffDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.black,
    marginRight: 12,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.borderLight,
    marginLeft: 3,
    marginVertical: 4,
  },
  address: {
    fontSize: 14,
    color: Colors.black,
    flex: 1,
  },

  // Payment Section
  paymentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginBottom: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.black,
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },

  // Trip Details
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tripStat: {
    alignItems: 'center',
  },
  tripStatLabel: {
    fontSize: 12,
    color: Colors.grayText,
    marginBottom: 2,
  },
  tripStatValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
  },
});
