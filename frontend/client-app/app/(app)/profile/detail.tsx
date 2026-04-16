import React from 'react';
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
import { useProfile, useUpdateProfile } from '@/src/hooks/useProfile';

export default function ProfileDetailScreen() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const handleBackPress = () => {
    router.back();
  };

  const handlePersonalDataPress = () => {
    router.push('/(app)/profile/personal-info');
  };

  const handleAddressesPress = () => {
    router.push('/(app)/profile/saved-addresses');
  };

  const handleLanguagePress = () => {
    router.push('/(app)/profile/language');
  };

  const handlePasswordPress = () => {
    router.push('/(app)/profile/change-password');
  };

  const handleDeleteAccountPress = () => {
    Alert.alert(
      'Видалення акаунту',
      'Ви впевнені, що хочете видалити свій акаунт? Цю дію неможливо скасувати.',
      [
        { text: 'Скасувати', style: 'cancel' },
        { text: 'Видалити', style: 'destructive', onPress: () => {
          // Handle account deletion
        }}
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Завантаження...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Профіль</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {profile?.profile_image ? (
              <Image source={{ uri: profile.profile_image }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {profile?.first_name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.userName}>{profile?.full_name || 'Користувач'}</Text>
          <Text style={styles.userPhone}>{profile?.phone_number || 'Телефон не вказано'}</Text>
          
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color={Colors.warning} />
            <Text style={styles.rating}>{profile?.average_rating || 0}</Text>
            <Text style={styles.ratingLabel}>Рейтинг</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handlePersonalDataPress}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="person" size={24} color={Colors.black} />
              <Text style={styles.menuItemText}>Особисті дані</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.grayText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleAddressesPress}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="location" size={24} color={Colors.black} />
              <Text style={styles.menuItemText}>Обрані адреси</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.grayText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLanguagePress}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="language" size={24} color={Colors.black} />
              <Text style={styles.menuItemText}>Мова</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemValue}>
                {profile?.language === 'uk' ? 'Українська' : 'English'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.grayText} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handlePasswordPress}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="lock-closed" size={24} color={Colors.black} />
              <Text style={styles.menuItemText}>Зміна паролю</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.grayText} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <TouchableOpacity 
            style={styles.dangerItem} 
            onPress={handleDeleteAccountPress}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="trash" size={24} color={Colors.error} />
              <Text style={[styles.menuItemText, styles.dangerText]}>Видалити акаунт</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

  // Content
  content: {
    flex: 1,
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.white,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '600',
    color: Colors.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 8,
  },
  userPhone: {
    fontSize: 16,
    color: Colors.grayText,
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rating: {
    marginLeft: 4,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginRight: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: Colors.grayText,
  },

  // Menu Section
  menuSection: {
    marginTop: 8,
    backgroundColor: Colors.white,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 16,
    color: Colors.black,
  },
  menuItemValue: {
    marginRight: 8,
    fontSize: 16,
    color: Colors.grayText,
  },

  // Danger Section
  dangerSection: {
    marginTop: 32,
    backgroundColor: Colors.white,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dangerText: {
    color: Colors.error,
  },
});
