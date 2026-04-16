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
import { RatingStars } from './RatingStars';

interface RideHistoryItemProps {
  ride: RideHistoryItemType;
  onPress: () => void;
}

export function RideHistoryItem({
  ride,
  onPress,
}: RideHistoryItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(ride.created_at)}</Text>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: ride.status === 'completed' ? Colors.success : Colors.error },
            ]}
          />
          <Text style={styles.price}>{Math.round(ride.final_amount)} ₴</Text>
        </View>
      </View>

      <View style={styles.route}>
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

      {ride.status === 'completed' && ride.user_rating && (
        <View style={styles.ratingContainer}>
          <RatingStars rating={ride.user_rating} size={16} readonly />
        </View>
      )}

      {ride.status === 'cancelled' && (
        <View style={styles.cancelledContainer}>
          <Text style={styles.cancelledText}>Скасовано</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  date: {
    fontSize: 14,
    color: Colors.grayText,
  },

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  price: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },

  route: {
    marginBottom: 8,
  },

  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.black,
    marginRight: 12,
  },

  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.lightGray,
    marginLeft: 3,
    marginBottom: 4,
  },

  address: {
    flex: 1,
    fontSize: 14,
    color: Colors.black,
  },

  ratingContainer: {
    alignItems: 'flex-start',
  },

  cancelledContainer: {
    alignItems: 'flex-start',
  },

  cancelledText: {
    fontSize: 14,
    color: Colors.error,
    fontStyle: 'italic',
  },
});