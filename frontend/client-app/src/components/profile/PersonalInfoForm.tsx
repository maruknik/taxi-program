import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { PersonalInfo, GENDER_OPTIONS } from '@/src/types/user.types';

interface PersonalInfoFormProps {
  initialData: PersonalInfo;
  onSave: (data: any) => void;
  isLoading: boolean;
}

export function PersonalInfoForm({ initialData, onSave, isLoading }: PersonalInfoFormProps) {
  const [firstName, setFirstName] = useState(initialData.first_name || '');
  const [lastName, setLastName] = useState(initialData.last_name || '');
  const [dateOfBirth, setDateOfBirth] = useState(
    initialData.date_of_birth ? new Date(initialData.date_of_birth) : null
  );
  const [gender, setGender] = useState(initialData.gender || 'N');
  const [phoneNumber, setPhoneNumber] = useState(initialData.phone_number || '');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = () => {
    // Validation
    if (!firstName.trim()) {
      Alert.alert('Помилка', "Введіть ім'я");
      return;
    }

    if (!lastName.trim()) {
      Alert.alert('Помилка', 'Введіть прізвище');
      return;
    }

    const data = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      date_of_birth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : null,
      gender,
      phone_number: phoneNumber.trim() || null,
    };

    onSave(data);
  };

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters except +
    const cleaned = text.replace(/[^\d+]/g, '');
    
    // Auto-add +380 for Ukrainian numbers
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      return '+38' + cleaned;
    }
    
    return cleaned;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Оберіть дату';
    return date.toLocaleDateString('uk-UA');
  };

  return (
    <View style={styles.container}>
      {/* First Name */}
      <View style={styles.field}>
        <Text style={styles.label}>Ім'я *</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Введіть ім'я"
          autoCapitalize="words"
        />
      </View>

      {/* Last Name */}
      <View style={styles.field}>
        <Text style={styles.label}>Прізвище *</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Введіть прізвище"
          autoCapitalize="words"
        />
      </View>

      {/* Date of Birth */}
      <View style={styles.field}>
        <Text style={styles.label}>Дата народження</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {formatDate(dateOfBirth)}
          </Text>
          <Ionicons name="calendar" size={20} color={Colors.grayText} />
        </TouchableOpacity>
      </View>

      {/* Gender */}
      <View style={styles.field}>
        <Text style={styles.label}>Стать</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={gender}
            onValueChange={setGender}
            style={styles.picker}
            mode="dropdown"
          >
            {GENDER_OPTIONS.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Phone Number */}
      <View style={styles.field}>
        <Text style={styles.label}>Телефон</Text>
        <View style={styles.phoneContainer}>
          <TextInput
            style={[styles.input, styles.phoneInput]}
            value={phoneNumber}
            onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
            placeholder="+380671234567"
            keyboardType="phone-pad"
          />
          
          {initialData.phone_verified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            </View>
          ) : phoneNumber && (
            <TouchableOpacity style={styles.verifyButton}>
              <Text style={styles.verifyText}>Підтвердити</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Email (read-only) */}
      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.emailContainer}>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={initialData.email}
            editable={false}
          />
          
          {initialData.email_verified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            </View>
          ) : (
            <TouchableOpacity style={styles.verifyButton}>
              <Text style={styles.verifyText}>Підтвердити</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.disabledButton]}
        onPress={handleSave}
        disabled={isLoading}
      >
        <Text style={styles.saveButtonText}>
          {isLoading ? 'Збереження...' : 'Зберегти'}
        </Text>
      </TouchableOpacity>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setDateOfBirth(selectedDate);
            }
          }}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },

  // Field
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: Colors.white,
  },
  disabledInput: {
    backgroundColor: Colors.lightGray,
    color: Colors.grayText,
  },

  // Date Picker
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
  placeholder: {
    color: Colors.grayText,
  },

  // Gender Picker
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  picker: {
    height: 50,
  },

  // Phone
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneInput: {
    flex: 1,
    marginRight: 8,
  },

  // Email
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Verification
  verifiedBadge: {
    padding: 8,
  },
  verifyButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  verifyText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '500',
  },

  // Save Button
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: Colors.grayText,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
