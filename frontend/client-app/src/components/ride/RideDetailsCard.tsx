import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { LocationWithAddress } from '@/src/types';
import { RouteInfo } from './RouteInfo';

interface RideDetailsCardProps {
  pickupLocation: LocationWithAddress;
  dropoffLocation: LocationWithAddress;
  waypointLocations?: (LocationWithAddress | null)[];
  estimatedPrice: number;
  distance: number;
  duration: number;
  rideType: string;
  paymentMethod: string;
  onExpand?: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

export function RideDetailsCard({
  pickupLocation,
  dropoffLocation,
  waypointLocations = [],
  estimatedPrice,
  distance,
  duration,
  rideType,
  paymentMethod,
  onExpand,
}: RideDetailsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    
    Animated.spring(animation, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();

    setIsExpanded(!isExpanded);
    onExpand?.();
  };

  const cardHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [120, screenHeight * 0.7],
  });

  const contentOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Animated.View style={[styles.container, { height: cardHeight }]}>
      {/* Header - завжди видимий */}
      <TouchableOpacity style={styles.header} onPress={toggleExpanded}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.destination} numberOfLines={1}>
              {dropoffLocation.address}
            </Text>
            <Text style={styles.rideInfo}>
              {rideType} • {Math.round(estimatedPrice)} ₴ • {distance.toFixed(1)} км
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <Text style={styles.duration}>{duration} хв</Text>
            <Ionicons 
              name={isExpanded ? "chevron-down" : "chevron-up"} 
              size={20} 
              color={Colors.grayText} 
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      <Animated.View style={[styles.expandedContent, { opacity: contentOpacity }]}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Маршрут</Text>
          <RouteInfo
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            waypointLocations={waypointLocations}
            showIcons={true}
          />
        </View>

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
            <Text style={styles.detailValue}>~{duration} хв</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Оплата</Text>
          <View style={styles.paymentRow}>
            <Ionicons name="wallet" size={20} color={Colors.black} />
            <Text style={styles.paymentText}>{paymentMethod}</Text>
            <Text style={styles.paymentAmount}>{Math.round(estimatedPrice)} ₴</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Дії</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share" size={20} color={Colors.primary} />
              <Text style={styles.actionText}>Поділитися</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="receipt" size={20} color={Colors.primary} />
              <Text style={styles.actionText}>Чек</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  destination: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  rideInfo: {
    fontSize: 14,
    color: Colors.grayText,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  duration: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },

  // Expanded Content
  expandedContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },

  // Details
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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

  // Actions
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  actionText: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.primary,
  },
});