import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { useRideStore } from '@/src/store/useRideStore';
import { useRateRide } from '@/src/hooks/useRateRide';
import { useRideDetails } from '@/src/hooks/useRideDetails';
import { RatingStars } from '@/src/components/ride/RatingStars';
import { RideReceipt } from '@/src/components/ride/RideReceipt';

export default function RideRatingScreen() {
  const router = useRouter();
  const {
    currentRideId,
    pickupLocation,
    dropoffLocation,
    selectedRideType,
    priceEstimates,
  } = useRideStore();

  const rateRide = useRateRide();
  // Freeze rideId at mount — store may be reset before query completes
  const frozenRideId = useRef(currentRideId).current;
  const { data: rideDetails } = useRideDetails(frozenRideId);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);

  // Real driver data from backend (RideSerializer returns driver_info.vehicle as string, plate as direct field)
  const driverInfo = (rideDetails as any)?.driver_info ?? null;
  const driverName = driverInfo ? `${driverInfo.name ?? ''}`.trim() || 'Водій' : 'Водій';
  const driverVehicle = typeof driverInfo?.vehicle === 'string'
    ? driverInfo.vehicle
    : driverInfo?.vehicle
      ? `${driverInfo.vehicle.make ?? ''} ${driverInfo.vehicle.model ?? ''}`.trim()
      : '';
  const driverPlate = driverInfo?.plate ?? driverInfo?.vehicle?.plate ?? '';

  // Real ride data
  const selectedEstimate = priceEstimates?.find(
    estimate => (estimate as any).vehicle_type === selectedRideType
  );
  const rideDistance = (rideDetails as any)?.estimated_distance ?? selectedEstimate?.distance_km ?? 0;
  const rideDuration = (rideDetails as any)?.estimated_duration ?? selectedEstimate?.duration_minutes ?? 0;
  const rideTotalFare = (rideDetails as any)?.final_price ?? (rideDetails as any)?.estimated_price ?? selectedEstimate?.estimated_price ?? 0;
  const rideDate = (rideDetails as any)?.completed_at ? new Date((rideDetails as any).completed_at) : new Date();

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Помилка', 'Будь ласка, оберіть рейтинг');
      return;
    }

    if (!frozenRideId) {
      Alert.alert('Помилка', 'Не знайдено ID поїздки');
      return;
    }

    try {
      await rateRide.mutateAsync({
        rideId: frozenRideId,
        rating,
        comment,
      });
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося відправити рейтинг');
    }
  };

  const handleSkipRating = () => {
    Alert.alert(
      'Пропустити рейтинг?',
      'Ви впевнені що хочете пропустити оцінку поїздки?',
      [
        { text: 'Ні', style: 'cancel' },
        {
          text: 'Так, пропустити',
          onPress: () => router.replace('/main'),
        },
      ]
    );
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Погано';
      case 2: return 'Незадовільно';
      case 3: return 'Нормально';
      case 4: return 'Добре';
      case 5: return 'Відмінно';
      default: return 'Оберіть рейтинг';
    }
  };

  const getCommentPlaceholder = (rating: number) => {
    if (rating <= 2) {
      return 'Що пішло не так? Ваш відгук допоможе нам покращити сервіс';
    } else if (rating >= 4) {
      return 'Розкажіть, що вам сподобалось';
    }
    return 'Залишіть коментар (необов\'язково)';
  };

  if (!frozenRideId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Помилка: дані поїздки не знайдені</Text>
        <TouchableOpacity onPress={() => router.replace('/main')}>
          <Text style={styles.backText}>Повернутися на головну</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showReceipt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowReceipt(false)}>
            <Ionicons name="arrow-back" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Чек поїздки</Text>
          <TouchableOpacity onPress={() => router.replace('/main')}>
            <Ionicons name="close" size={24} color={Colors.black} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.receiptContainer}>
          <RideReceipt
            pickupLocation={pickupLocation!}
            dropoffLocation={dropoffLocation!}
            distance={rideDistance}
            duration={rideDuration}
            rideType={selectedRideType || 'economy'}
            baseFare={0}
            distanceFare={0}
            timeFare={0}
            totalFare={rideTotalFare}
            paymentMethod="Готівка"
            rideDate={rideDate}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkipRating}>
            <Text style={styles.skipText}>Пропустити</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Оцініть поїздку</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Driver Info */}
          <View style={styles.driverSection}>
            <View style={styles.driverPhoto}>
              <Ionicons name="person" size={40} color={Colors.grayText} />
            </View>
            <Text style={styles.driverName}>{driverName}</Text>
            <Text style={styles.driverVehicle}>
              {driverVehicle}{driverPlate ? ` • ${driverPlate}` : ''}
            </Text>
          </View>

          {/* Rating */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingTitle}>Як пройшла поїздка?</Text>
            <RatingStars
              rating={rating}
              onRatingChange={setRating}
              size={40}
            />
            <Text style={styles.ratingText}>{getRatingText(rating)}</Text>
          </View>

          {/* Comment */}
          <View style={styles.commentSection}>
            <Text style={styles.commentTitle}>Залишити коментар</Text>
            <TextInput
              style={styles.commentInput}
              placeholder={getCommentPlaceholder(rating)}
              placeholderTextColor={Colors.grayText}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Quick Feedback */}
          {rating <= 2 && (
            <View style={styles.quickFeedbackSection}>
              <Text style={styles.quickFeedbackTitle}>Що пішло не так?</Text>
              <View style={styles.quickFeedbackButtons}>
                {[
                  'Водій запізнився',
                  'Неввічливий водій',
                  'Погана якість авто',
                  'Неправильний маршрут',
                  'Проблеми з оплатою',
                  'Інше',
                ].map((issue) => (
                  <TouchableOpacity
                    key={issue}
                    style={styles.quickFeedbackButton}
                    onPress={() => setComment(comment ? `${comment}, ${issue}` : issue)}
                  >
                    <Text style={styles.quickFeedbackButtonText}>{issue}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Trip Summary */}
          <View style={styles.summarySection}>
            <TouchableOpacity
              style={styles.summaryRow}
              onPress={() => setShowReceipt(true)}
            >
              <View style={styles.summaryLeft}>
                <Ionicons name="receipt" size={20} color={Colors.black} />
                <Text style={styles.summaryText}>Переглянути чек</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.grayText} />
            </TouchableOpacity>

            <View style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <Ionicons name="time" size={20} color={Colors.black} />
                <Text style={styles.summaryText}>
                  {rideDuration} хв • {Number(rideDistance).toFixed(1)} км
                </Text>
              </View>
              <Text style={styles.summaryPrice}>{rideTotalFare} ₴</Text>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              rating === 0 && styles.submitButtonDisabled,
              rateRide.isPending && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitRating}
            disabled={rating === 0 || rateRide.isPending}
          >
            <Text style={styles.submitButtonText}>
              {rateRide.isPending ? 'Відправляємо...' : 'Відправити оцінку'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  skipText: {
    fontSize: 16,
    color: Colors.primary,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Driver
  driverSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  driverPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  driverVehicle: {
    fontSize: 14,
    color: Colors.grayText,
  },

  // Rating
  ratingSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.black,
    marginBottom: 20,
  },
  ratingText: {
    fontSize: 16,
    color: Colors.grayText,
    marginTop: 12,
  },

  // Comment
  commentSection: {
    marginBottom: 24,
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.black,
    minHeight: 100,
  },

  // Quick Feedback
  quickFeedbackSection: {
    marginBottom: 24,
  },
  quickFeedbackTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
    marginBottom: 12,
  },
  quickFeedbackButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickFeedbackButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 20,
  },
  quickFeedbackButtonText: {
    fontSize: 14,
    color: Colors.black,
  },

  // Summary
  summarySection: {
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  summaryText: {
    marginLeft: 12,
    fontSize: 16,
    color: Colors.black,
  },
  summaryPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },

  // Bottom
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  submitButton: {
    paddingVertical: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.grayText,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },

  // Receipt
  receiptContainer: {
    flex: 1,
  },

  // Error
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