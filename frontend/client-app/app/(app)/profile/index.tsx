import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/constants/theme';
import { useProfile } from '@/src/hooks/useProfile';
import { useDeletionStatus, useCancelDeletion } from '@/src/hooks/useAccountDeletion';
import { DeleteAccountModal } from '@/src/components/profile/DeleteAccountModal';
import { DeletionWarning } from '@/src/components/profile/DeletionWarning';

export default function ProfileScreen() {
  const router = useRouter();
  const { data: profile, isLoading, error } = useProfile();
  const { data: deletionStatus } = useDeletionStatus();
  const cancelDeletion = useCancelDeletion();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleRidesPress = () => {
    router.push('/(app)/ride/history');
  };

  const handlePaymentPress = () => {
    router.push('/(app)/payment');
  };

  const handleHelpPress = () => {
    Alert.alert('Допомога', 'Служба підтримки: +380 68 123 45 67');
  };

  const handleUpdatePress = () => {
    Alert.alert('Оновлення', 'Перевірка наявності оновлень...');
  };

  const handleBecomeDriverPress = () => {
    Alert.alert('Водій Vard', 'Скоро буде доступно!');
  };

  const handleProfileDetailPress = () => {
    router.push('/(app)/profile/detail');
  };

  const handleCancelDeletion = async () => {
    try {
      await cancelDeletion.mutateAsync();
      Alert.alert('Успіх', 'Видалення акаунту скасовано');
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося скасувати видалення');
    }
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    // Redirect to login or onboarding
    router.replace('/(auth)/login');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Завантаження...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text>Помилка завантаження профілю</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Deletion Warning */}
      {deletionStatus && (
        <DeletionWarning
          deletionStatus={deletionStatus}
          onCancel={handleCancelDeletion}
        />
      )}

      {/* Header with Avatar */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={handleProfileDetailPress}
        >
          {profile?.profile_image ? (
            <Image source={{ uri: profile.profile_image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {profile?.first_name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{profile?.full_name || 'Користувач'}</Text>
          <Text style={styles.userCity}>{profile?.city || 'Місто не вказано'}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={Colors.warning} />
            <Text style={styles.rating}>{profile?.average_rating || 0}</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile?.total_rides || 0}</Text>
          <Text style={styles.statLabel}>Поїздок</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round(profile?.total_spent || 0)}₴</Text>
          <Text style={styles.statLabel}>Витрачено</Text>
        </View>
      </View>

      {/* Menu Sections */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={handleRidesPress}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="car" size={24} color={Colors.black} />
            <Text style={styles.menuItemText}>Поїздки</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.grayText} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handlePaymentPress}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="card" size={24} color={Colors.black} />
            <Text style={styles.menuItemText}>Оплата</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.grayText} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleHelpPress}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="help-circle" size={24} color={Colors.black} />
            <Text style={styles.menuItemText}>Допомога</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.grayText} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => setShowDeleteModal(true)}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="trash-outline" size={24} color={Colors.error} />
            <Text style={[styles.menuItemText, { color: Colors.error }]}>Видалити акаунт</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {/* Update Button */}
      <TouchableOpacity style={styles.updateButton} onPress={handleUpdatePress}>
        <Ionicons name="refresh" size={20} color={Colors.primary} />
        <Text style={styles.updateButtonText}>Оновити застосунок</Text>
      </TouchableOpacity>

      {/* Become Driver Promo */}
      <View style={styles.promoSection}>
        <Text style={styles.promoTitle}>Хочеш стати водієм Vard?</Text>
        <TouchableOpacity style={styles.promoButton} onPress={handleBecomeDriverPress}>
          <Text style={styles.promoButtonText}>Дізнатися більше</Text>
        </TouchableOpacity>
      </View>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleDeleteSuccess}
      />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  userCity: {
    fontSize: 16,
    color: Colors.grayText,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.grayText,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 16,
  },

  // Menu
  menuSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 16,
    color: Colors.black,
  },

  // Update Button
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    marginBottom: 20,
  },
  updateButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Promo
  promoSection: {
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 20,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  promoButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
  },
  promoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});
