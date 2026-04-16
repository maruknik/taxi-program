import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { LocationWithAddress } from '@/src/types';

interface RideReceiptProps {
  pickupLocation: LocationWithAddress;
  dropoffLocation: LocationWithAddress;
  distance: number;
  duration: number;
  rideType: string;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  totalFare: number;
  paymentMethod: string;
  rideDate: Date;
}

export function RideReceipt({
  pickupLocation,
  dropoffLocation,
  distance,
  duration,
  rideType,
  baseFare,
  distanceFare,
  timeFare,
  totalFare,
  paymentMethod,
  rideDate,
}: RideReceiptProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Чек поїздки</Text>
        <Text style={styles.date}>
          {formatDate(rideDate)} о {formatTime(rideDate)}
        </Text>
      </View>

      {/* Route */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Маршрут</Text>
        
        <View style={styles.routeItem}>
          <View style={styles.routeDot} />
          <Text style={styles.routeText} numberOfLines={2}>
            {pickupLocation.address}
          </Text>
        </View>
        
        <View style={styles.routeLine} />
        
        <View style={styles.routeItem}>
          <View style={[styles.routeDot, styles.routeDotEnd]} />
          <Text style={styles.routeText} numberOfLines={2}>
            {dropoffLocation.address}
          </Text>
        </View>
      </View>

      {/* Trip Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Деталі поїздки</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Тип автомобіля</Text>
          <Text style={styles.detailValue}>{rideType}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Відстань</Text>
          <Text style={styles.detailValue}>{distance.toFixed(1)} км</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Час в дорозі</Text>
          <Text style={styles.detailValue}>{duration} хв</Text>
        </View>
      </View>

      {/* Fare Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Розрахунок вартості</Text>
        
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Базовий тариф</Text>
          <Text style={styles.fareValue}>{baseFare.toFixed(2)} ₴</Text>
        </View>
        
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>За відстань ({distance.toFixed(1)} км)</Text>
          <Text style={styles.fareValue}>{distanceFare.toFixed(2)} ₴</Text>
        </View>
        
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>За час ({duration} хв)</Text>
          <Text style={styles.fareValue}>{timeFare.toFixed(2)} ₴</Text>
        </View>
        
        <View style={styles.separator} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Загальна сума</Text>
          <Text style={styles.totalValue}>{totalFare.toFixed(2)} ₴</Text>
        </View>
      </View>

      {/* Payment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Оплата</Text>
        
        <View style={styles.paymentRow}>
          <Ionicons name="wallet" size={20} color={Colors.black} />
          <Text style={styles.paymentText}>{paymentMethod}</Text>
          <Text style={styles.paymentAmount}>{totalFare.toFixed(2)} ₴</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: Colors.grayText,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },

  // Route
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    marginRight: 12,
    marginTop: 4,
  },
  routeDotEnd: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.black,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.lightGray,
    marginLeft: 5,
    marginBottom: 8,
  },
  routeText: {
    flex: 1,
    fontSize: 14,
    color: Colors.black,
    lineHeight: 20,
  },

  // Details
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.grayText,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
  },

  // Fare
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  fareLabel: {
    fontSize: 14,
    color: Colors.grayText,
  },
  fareValue: {
    fontSize: 14,
    color: Colors.black,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },

  // Payment
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: Colors.black,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
});