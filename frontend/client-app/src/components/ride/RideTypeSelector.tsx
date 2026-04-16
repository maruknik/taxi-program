import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { useRideStore } from '@/src/store/useRideStore';
import { useEstimatePrice } from '@/src/hooks/useEstimatePrice';
import { RIDE_TYPES } from '@/src/constants/rideTypes';
import { RideType, PriceEstimate } from '@/src/types/ride.types';
import { usePaymentMethods } from '@/src/hooks/usePaymentMethods';
import { PaymentMethod } from '@/src/types/payment.types';

interface RideTypeSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: RideType) => void;
}

export function RideTypeSelector({ visible, onClose, onSelectType }: RideTypeSelectorProps) {
  const {
    pickupLocation,
    dropoffLocation,
    selectedRideType,
    priceEstimates,
    setPriceEstimates,
    setSelectedRideType,
  } = useRideStore();

  const estimatePrice = useEstimatePrice();
  const { data: paymentMethodsData } = usePaymentMethods();
  const paymentMethods = Array.isArray(paymentMethodsData) ? paymentMethodsData : [];
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | 'cash'>('cash');
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);

  useEffect(() => {
    if (visible && pickupLocation && dropoffLocation && !priceEstimates) {
      // Make single request to get all estimates
      estimatePrice.mutate({
        pickup_lat: pickupLocation.latitude,
        pickup_lon: pickupLocation.longitude,
        dropoff_lat: dropoffLocation.latitude,
        dropoff_lon: dropoffLocation.longitude,
        vehicle_type: 'economy', // Send economy as default, API should return all types
      }, {
        onSuccess: (data) => {
          const estimates: PriceEstimate[] = data.estimates ? Object.values(data.estimates) : [];
          setPriceEstimates(estimates);
        },
        onError: (error) => {
          console.error('Price estimation failed:', error);
          // Use fallback prices when API fails
          const fallbackEstimates: PriceEstimate[] = [
            {
              vehicle_type: 'economy',
              estimated_price: 50,
              distance_km: 5,
              duration_minutes: 10,
              eta_minutes: 5,
            },
            {
              vehicle_type: 'comfort',
              estimated_price: 70,
              distance_km: 5,
              duration_minutes: 10,
              eta_minutes: 3,
            },
            {
              vehicle_type: 'business',
              estimated_price: 100,
              distance_km: 5,
              duration_minutes: 10,
              eta_minutes: 1,
            },
          ];
          setPriceEstimates(fallbackEstimates);
        },
      });
    }
  }, [visible, pickupLocation, dropoffLocation, priceEstimates]);

  const handleSelectType = (type: RideType) => {
    setSelectedRideType(type);
    onSelectType(type);
  };

  const getEstimateForType = (type: RideType): PriceEstimate | null => {
    return priceEstimates?.find(estimate => estimate.vehicle_type === type) || null;
  };

  const renderRideTypeOption = (rideType: typeof RIDE_TYPES[0]) => {
    const estimate = getEstimateForType(rideType.id);
    const isSelected = selectedRideType === rideType.id;
    const price = estimate?.estimated_price || rideType.basePrice;
    const eta = estimate?.eta_minutes || rideType.eta;

    return (
      <TouchableOpacity
        key={rideType.id}
        style={[
          styles.rideTypeOption,
          isSelected && styles.rideTypeOptionSelected,
        ]}
        onPress={() => handleSelectType(rideType.id)}
      >
        <View style={styles.rideTypeIcon}>
          <Text style={styles.iconText}>{rideType.icon}</Text>
        </View>

        <View style={styles.rideTypeInfo}>
          <Text style={styles.rideTypeName}>{rideType.name}</Text>
          <Text style={styles.rideTypeDescription}>
            Прибуття: {eta}:{(eta % 60).toString().padStart(2, '0')}
          </Text>
          <Text style={styles.rideTypeDescription}>
            Через {eta} хвилин
          </Text>
        </View>

        <View style={styles.rideTypePrice}>
          <Text style={styles.priceText}>{Math.round(price)} ₴</Text>
          {estimate && (
            <Text style={styles.originalPrice}>
              {Math.round(estimate.estimated_price * 1.2)} ₴
            </Text>
          )}
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark" size={20} color={Colors.white} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.title}>Обрати тип поїздки</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Loading State */}
        {estimatePrice.isPending && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Розраховуємо вартість...</Text>
          </View>
        )}

        {/* Ride Types */}
        {!estimatePrice.isPending && (
          <View style={styles.rideTypesContainer}>
            {RIDE_TYPES.map(renderRideTypeOption)}
          </View>
        )}

        {/* Payment Method */}
        <TouchableOpacity style={styles.paymentOption} onPress={() => setShowPaymentPicker(true)}>
          <Ionicons
            name={selectedPayment === 'cash' ? 'wallet' : 'card'}
            size={24}
            color={Colors.black}
          />
          <Text style={styles.paymentText}>
            {selectedPayment === 'cash'
              ? 'Готівка'
              : `•••• ${(selectedPayment as PaymentMethod).last_four_digits}`}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.grayText} />
        </TouchableOpacity>

        {/* Payment Picker Modal */}
        <Modal
          visible={showPaymentPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPaymentPicker(false)}
        >
          <TouchableOpacity
            style={styles.pickerOverlay}
            activeOpacity={1}
            onPress={() => setShowPaymentPicker(false)}
          >
            <View style={styles.pickerSheet}>
              <Text style={styles.pickerTitle}>Спосіб оплати</Text>

              {/* Cash */}
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  selectedPayment === 'cash' && styles.pickerItemSelected,
                ]}
                onPress={() => { setSelectedPayment('cash'); setShowPaymentPicker(false); }}
              >
                <Ionicons name="wallet" size={22} color={Colors.black} />
                <Text style={styles.pickerItemText}>Готівка</Text>
                {selectedPayment === 'cash' && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>

              {/* Cards */}
              {paymentMethods.filter(m => m.type === 'card' && m.is_active).map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.pickerItem,
                    (selectedPayment as PaymentMethod)?.id === method.id && styles.pickerItemSelected,
                  ]}
                  onPress={() => { setSelectedPayment(method); setShowPaymentPicker(false); }}
                >
                  <Ionicons name="card" size={22} color={Colors.black} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.pickerItemText}>•••• {method.last_four_digits}</Text>
                    {method.display_name ? (
                      <Text style={styles.pickerItemSub}>{method.display_name}</Text>
                    ) : null}
                  </View>
                  {(selectedPayment as PaymentMethod)?.id === method.id && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.pickerCancel}
                onPress={() => setShowPaymentPicker(false)}
              >
                <Text style={styles.pickerCancelText}>Скасувати</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Book Button */}
        <TouchableOpacity
          style={[
            styles.bookButton,
            !selectedRideType && styles.bookButtonDisabled,
          ]}
          onPress={() => {
            if (selectedRideType) {
              onSelectType(selectedRideType);
              onClose();
            }
          }}
          disabled={!selectedRideType}
        >
          <Text style={styles.bookButtonText}>Замовити</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.grayText,
  },

  // Ride Types
  rideTypesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  rideTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rideTypeOptionSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  rideTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  rideTypeInfo: {
    flex: 1,
  },
  rideTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  rideTypeDescription: {
    fontSize: 14,
    color: Colors.grayText,
    marginBottom: 1,
  },
  rideTypePrice: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  originalPrice: {
    fontSize: 12,
    color: Colors.grayText,
    textDecorationLine: 'line-through',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Payment
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
  },
  paymentText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.black,
  },

  // Payment Picker
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 36,
    paddingHorizontal: 16,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pickerItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F5F0FF',
  },
  pickerItemText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.black,
  },
  pickerItemSub: {
    fontSize: 12,
    color: Colors.grayText,
    marginTop: 2,
  },
  pickerCancel: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.lightGray,
  },
  pickerCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
  },

  // Book Button
  bookButton: {
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: Colors.grayText,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
