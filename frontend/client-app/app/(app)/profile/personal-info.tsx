import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/src/constants/theme';
import { useProfile, useUpdateProfile } from '@/src/hooks/useProfile';

const GENDER_OPTIONS = [
  { value: 'M', label: 'Чоловік' },
  { value: 'F', label: 'Жінка' },
  { value: 'O', label: 'Інше' },
  { value: 'N', label: 'Не вказано' },
];

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'N',
    phone_number: '',
    email: '',
  });

  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [localPhoto, setLocalPhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || 'N',
        phone_number: profile.phone_number || '',
        email: profile.email || '',
      });
    }
  }, [profile]);

  const handleBackPress = () => {
    router.back();
  };

  const handleSavePress = () => {
    // Remove email from update data since it's not updatable
    const { email, ...updateData } = formData;
    
    // Filter out empty values to avoid validation errors
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([key, value]) => 
        value !== '' && value !== null && value !== undefined
      )
    );
    
    updateProfile.mutate(filteredData, {
      onSuccess: (data) => {
        // Update local form data with response
        setFormData(prev => ({
          ...prev,
          first_name: data.first_name || prev.first_name,
          last_name: data.last_name || prev.last_name,
          gender: data.gender || prev.gender,
          phone_number: data.phone_number || prev.phone_number,
        }));
        
        Alert.alert(
          'Успіх', 
          'Особисті дані збережено',
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Force refresh profile data before going back
                router.back();
              }
            }
          ]
        );
      },
      onError: (error) => {
        Alert.alert('Помилка', 'Не вдалося зберегти дані');
        console.error('Update profile error:', error);
      },
    });
  };

  const handleGenderSelect = (gender: string) => {
    setFormData(prev => ({ ...prev, gender }));
    setShowGenderPicker(false);
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Дозвіл', 'Потрібен дозвіл до галереї');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as const,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const base64Uri = `data:image/jpeg;base64,${asset.base64}`;
      setLocalPhoto(asset.uri);
      setUploadingPhoto(true);
      updateProfile.mutate(
        { profile_image: base64Uri },
        {
          onSuccess: () => setUploadingPhoto(false),
          onError: () => {
            setUploadingPhoto(false);
            Alert.alert('Помилка', 'Не вдалося завантажити фото');
            setLocalPhoto(null);
          },
        }
      );
    }
  };

  const parsedDateOfBirth = formData.date_of_birth ? new Date(formData.date_of_birth) : new Date(2000, 0, 1);

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'ДД.ММ.РРРР';
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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
        <Text style={styles.headerTitle}>Особисті дані</Text>
        <TouchableOpacity onPress={handleSavePress}>
          <Text style={styles.saveButton}>Зберегти</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickPhoto}>
            {(localPhoto || profile?.profile_image) ? (
              <Image source={{ uri: localPhoto || profile!.profile_image }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {formData.first_name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              {uploadingPhoto
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Ionicons name="camera" size={18} color={Colors.white} />}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickPhoto}>
            <Text style={styles.changePhotoText}>Змінити фото</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Name Fields */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Ім'я</Text>
            <TextInput
              style={styles.textInput}
              value={formData.first_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, first_name: text }))}
              placeholder="Введіть ім'я"
              placeholderTextColor={Colors.grayText}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Прізвище</Text>
            <TextInput
              style={styles.textInput}
              value={formData.last_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, last_name: text }))}
              placeholder="Введіть прізвище"
              placeholderTextColor={Colors.grayText}
            />
          </View>

          {/* Date of Birth */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Дата народження</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[
                styles.dateText,
                !formData.date_of_birth && styles.placeholderText,
              ]}>
                {formatDateForDisplay(formData.date_of_birth)}
              </Text>
              <Ionicons name="calendar" size={20} color={Colors.grayText} />
            </TouchableOpacity>
          </View>

          {/* Gender */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Стать</Text>
            <TouchableOpacity 
              style={styles.selectInput}
              onPress={() => setShowGenderPicker(true)}
            >
              <Text style={styles.selectText}>
                {GENDER_OPTIONS.find(opt => opt.value === formData.gender)?.label || 'Не вказано'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.grayText} />
            </TouchableOpacity>
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Телефон</Text>
            <TextInput
              style={styles.textInput}
              value={formData.phone_number}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone_number: text }))}
              placeholder="+380XXXXXXXXX"
              placeholderTextColor={Colors.grayText}
              keyboardType="phone-pad"
            />
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email адреса</Text>
            <TextInput
              style={[styles.textInput, styles.disabledInput]}
              value={formData.email}
              editable={false}
              placeholderTextColor={Colors.grayText}
            />
            <Text style={styles.emailNote}>
              Email можна змінити тільки через налаштування акаунту
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={parsedDateOfBirth}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          minimumDate={new Date(1920, 0, 1)}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (event.type === 'set' && selectedDate) {
              setFormData(prev => ({
                ...prev,
                date_of_birth: selectedDate.toISOString().split('T')[0],
              }));
            }
            if (Platform.OS === 'android') setShowDatePicker(false);
          }}
        />
      )}

      {/* Gender Picker Modal */}
      {showGenderPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Оберіть стать</Text>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>
            {GENDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.genderOption,
                  formData.gender === option.value && styles.selectedGenderOption,
                ]}
                onPress={() => handleGenderSelect(option.value)}
              >
                <Text style={[
                  styles.genderOptionText,
                  formData.gender === option.value && styles.selectedGenderOptionText,
                ]}>
                  {option.label}
                </Text>
                {formData.gender === option.value && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
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
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Content
  content: {
    flex: 1,
  },

  // Photo Section
  photoSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.white,
  },
  avatarContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '600',
    color: Colors.primary,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  placeholderText: {
    color: Colors.grayText,
  },

  // Form Section
  formSection: {
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.black,
    backgroundColor: Colors.white,
  },
  disabledInput: {
    backgroundColor: Colors.lightGray,
    color: Colors.grayText,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  dateText: {
    fontSize: 16,
    color: Colors.black,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  selectText: {
    fontSize: 16,
    color: Colors.black,
  },
  emailNote: {
    fontSize: 12,
    color: Colors.grayText,
    marginTop: 4,
  },

  // Gender Picker Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: 300,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  selectedGenderOption: {
    backgroundColor: Colors.lightGray,
  },
  genderOptionText: {
    fontSize: 16,
    color: Colors.black,
  },
  selectedGenderOptionText: {
    fontWeight: '600',
    color: Colors.primary,
  },
});
