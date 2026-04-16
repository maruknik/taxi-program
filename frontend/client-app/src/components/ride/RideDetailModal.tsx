import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { RideHistoryItem as RideHistoryItemType } from '@/src/hooks/useRideHistory';
import { useRepeatRide } from '@/src/hooks/useRideHistory';
import { useReceipt, useDownloadReceipt, useEmailReceipt } from '@/src/hooks/useReceipts';

interface RideDetailModalProps {
  visible: boolean;
  ride: RideHistoryItemType;
  onClose: () => void;
}

export function RideDetailModal({ visible, ride, onClose }: RideDetailModalProps) {
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  
  const repeatRide = useRepeatRide();
  const { data: receiptData } = useReceipt(visible ? ride.id : null);
  const downloadReceipt = useDownloadReceipt();
  const emailReceipt = useEmailReceipt();

  const handleDownloadReceipt = async () => {
    try {
      const receiptInfo = await downloadReceipt.mutateAsync(ride.id);
      Alert.alert(
        'Інформація про чек',
        receiptInfo,
        [
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося отримати інформацію про чек');
    }
  };

  const handleEmailReceipt = async () => {
    if (showEmailInput) {
      if (!emailAddress.trim()) {
        Alert.alert('Помилка', 'Введіть email адресу');
        return;
      }
      
      try {
        await emailReceipt.mutateAsync({
          ride_id: ride.id,
          email: emailAddress,
        });
        
        Alert.alert('Успішно', 'Чек надіслано на email');
        setShowEmailInput(false);
        setEmailAddress('');
      } catch (error) {
        Alert.alert('Помилка', 'Не вдалося надіслати чек');
      }
    } else {
      setShowEmailInput(true);
    }
  };

  const handleRepeatRide = (reverse: boolean = false) => {
    repeatRide.mutate(
      { ride_id: ride.id, reverse_route: reverse },
      {
        onSuccess: () => {
          Alert.alert('Успіх', 'Поїздку створено успішно!');
          onClose();
        },
        onError: (error) => {
          Alert.alert('Помилка', 'Не вдалося створити поїздку');
        },
      }
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return Colors.success;
      case 'cancelled': return Colors.error;
      default: return Colors.grayText;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Деталі поїздки</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.black} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Status and Date */}
            <View style={styles.statusSection}>
              <Text style={styles.date}>{formatDate(ride.created_at)}</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(ride.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(ride.status) }]}>
                  {ride.status === 'cancelled' ? 'Скасовано' : ride.status_display}
                </Text>
              </View>
            </View>

            {/* Driver Info */}
            {ride.driver_info && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Водій</Text>
                <View style={styles.driverCard}>
                  <View style={styles.driverHeader}>
                    <View style={styles.avatarContainer}>
                      <Text style={styles.avatarText}>
                        {ride.driver_info.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.driverInfo}>
                      <Text style={styles.driverName}>{ride.driver_info.name}</Text>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={16} color={Colors.warning} />
                        <Text style={styles.rating}>{ride.driver_info.rating.toFixed(1)}</Text>
                        <Text style={styles.rideCount}>• {ride.driver_info.total_rides} поїздок</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.vehicleSection}>
                    <Text style={styles.vehicleName}>
                      {ride.driver_info.vehicle.color} {ride.driver_info.vehicle.make} {ride.driver_info.vehicle.model}
                    </Text>
                    <Text style={styles.plateNumber}>{ride.driver_info.vehicle.plate}</Text>
                    {ride.driver_info.vehicle.year && (
                      <Text style={styles.vehicleYear}>{ride.driver_info.vehicle.year} рік</Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Route */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Маршрут</Text>
              <View style={styles.routeCard}>
                <View style={styles.routePoint}>
                  <View style={styles.pickupDot} />
                  <View style={styles.routeText}>
                    <Text style={styles.routeLabel}>Звідки</Text>
                    <Text style={styles.addressText}>{ride.pickup_address}</Text>
                  </View>
                </View>
                
                <View style={styles.routeLine} />
                
                <View style={styles.routePoint}>
                  <View style={styles.dropoffDot} />
                  <View style={styles.routeText}>
                    <Text style={styles.routeLabel}>Куди</Text>
                    <Text style={styles.addressText}>{ride.dropoff_address}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Trip Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Деталі поїздки</Text>
              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Відстань</Text>
                  <Text style={styles.detailValue}>{ride.distance_text}</Text>
                </View>
                {ride.duration_text !== '—' && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Час</Text>
                    <Text style={styles.detailValue}>{ride.duration_text}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Payment */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Оплата</Text>
              <View style={styles.paymentCard}>
                <View style={styles.paymentRow}>
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
                  <Text style={styles.paymentAmount}>
                    {Math.round(ride.payment_info.amount)}₴
                  </Text>
                </View>
              </View>
            </View>

            {/* Rating */}
            {ride.user_rating && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ваша оцінка</Text>
                <View style={styles.ratingCard}>
                  <View style={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= ride.user_rating! ? 'star' : 'star-outline'}
                        size={20}
                        color={Colors.warning}
                      />
                    ))}
                  </View>
                  {ride.user_comment && (
                    <Text style={styles.comment}>{ride.user_comment}</Text>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleRepeatRide(true)}
            >
              <Ionicons name="swap-vertical" size={20} color={Colors.white} />
              <Text style={styles.actionButtonText}>В зворотний бік</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.repeatButton]} 
              onPress={() => handleRepeatRide(false)}
            >
              <Ionicons name="repeat" size={20} color={Colors.white} />
              <Text style={styles.actionButtonText}>Повторити поїздку</Text>
            </TouchableOpacity>
          </View>

          {/* Receipt Actions */}
          <View style={styles.receiptActions}>
            <TouchableOpacity 
              style={styles.receiptButton} 
              onPress={handleDownloadReceipt}
              disabled={downloadReceipt.isPending}
            >
              <Ionicons name="download" size={20} color={Colors.primary} />
              <Text style={styles.receiptButtonText}>
                {downloadReceipt.isPending ? 'Завантаження...' : 'Завантажити чек'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.receiptButton} 
              onPress={handleEmailReceipt}
              disabled={emailReceipt.isPending}
            >
              <Ionicons name="mail" size={20} color={Colors.primary} />
              <Text style={styles.receiptButtonText}>
                {emailReceipt.isPending ? 'Надсилання...' : 'Надіслати чек'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email Input */}
          {showEmailInput && (
            <View style={styles.emailInputContainer}>
              <TextInput
                style={styles.emailInput}
                value={emailAddress}
                onChangeText={setEmailAddress}
                placeholder="Введіть email адресу"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.sendEmailButton}
                onPress={handleEmailReceipt}
                disabled={emailReceipt.isPending}
              >
                <Text style={styles.sendEmailButtonText}>Надіслати</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Status Section
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
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
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Sections
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },

  // Driver Card
  driverCard: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
    marginRight: 8,
  },
  rideCount: {
    fontSize: 12,
    color: Colors.grayText,
  },
  vehicleSection: {
    paddingLeft: 60,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
    marginBottom: 2,
  },
  plateNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  vehicleYear: {
    fontSize: 12,
    color: Colors.grayText,
  },

  // Route Card
  routeCard: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    marginRight: 12,
    marginTop: 2,
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.black,
    marginRight: 12,
    marginTop: 2,
  },
  routeText: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: Colors.grayText,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: Colors.black,
    lineHeight: 20,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.borderLight,
    marginLeft: 6,
    marginVertical: 8,
  },

  // Details Card
  detailsCard: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
  },
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

  // Payment Card
  paymentCard: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  paymentAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },

  // Rating Card
  ratingCard: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
  },
  ratingStars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  comment: {
    fontSize: 14,
    color: Colors.black,
    lineHeight: 20,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  repeatButton: {
    backgroundColor: Colors.success,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },

  // Receipt Actions
  receiptActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  receiptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  receiptButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Email Input
  emailInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.lightGray,
  },
  emailInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    fontSize: 16,
  },
  sendEmailButton: {
    paddingHorizontal: 20,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendEmailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
