import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { useCreateSavedAddress } from '@/src/hooks/useSavedAddresses';
import { AddressSearch } from '@/src/components/address/AddressSearch';
import { ADDRESS_TYPE_OPTIONS, AddressType } from '@/src/types/address.types';

export default function AddAddressScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  
  const createSavedAddress = useCreateSavedAddress();
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const [formData, setFormData] = useState({
    entrance: '',
    floor: '',
    apartment: '',
    notes: '',
    custom_name: '',
  });

  const typeOption = ADDRESS_TYPE_OPTIONS.find(opt => opt.value === type);

  const handleAddressSelect = (address: any) => {
    setSelectedAddress(address);
    setShowDetails(true);
  };

  const handleSave = async () => {
    if (!selectedAddress) {
      Alert.alert('Помилка', 'Оберіть адресу');
      return;
    }

    if (type === 'favorite' && !formData.custom_name.trim()) {
      Alert.alert('Помилка', 'Для обраного місця потрібна назва');
      return;
    }

    try {
      const addressData = {
        type: type as AddressType,
        address: selectedAddress.address,
        latitude: selectedAddress.latitude,
        longitude: selectedAddress.longitude,
        entrance: formData.entrance.trim() || undefined,
        floor: formData.floor.trim() || undefined,
        apartment: formData.apartment.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        custom_name: type === 'favorite' ? formData.custom_name.trim() : undefined,
      };

      await createSavedAddress.mutateAsync(addressData);
      Alert.alert('Успіх', 'Адресу збережено', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося зберегти адресу');
    }
  };

  const renderDetailsForm = () => {
    if (!showDetails) return null;

    return (
      <View style={styles.detailsForm}>
        <Text style={styles.sectionTitle}>Деталі адреси</Text>
        
        {/* Custom Name for Favorites */}
        {type === 'favorite' && (
          <View style={styles.field}>
            <Text style={styles.label}>Назва місця *</Text>
            <TextInput
              style={styles.input}
              value={formData.custom_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, custom_name: text }))}
              placeholder="Наприклад: Улюблена кав'ярня"
              autoCapitalize="words"
            />
          </View>
        )}

        {/* Entrance */}
        <View style={styles.field}>
          <Text style={styles.label}>Під'їзд</Text>
          <TextInput
            style={styles.input}
            value={formData.entrance}
            onChangeText={(text) => setFormData(prev => ({ ...prev, entrance: text }))}
            placeholder="1"
            keyboardType="numeric"
          />
        </View>

        {/* Floor */}
        <View style={styles.field}>
          <Text style={styles.label}>Поверх</Text>
          <TextInput
            style={styles.input}
            value={formData.floor}
            onChangeText={(text) => setFormData(prev => ({ ...prev, floor: text }))}
            placeholder="5"
            keyboardType="numeric"
          />
        </View>

        {/* Apartment */}
        <View style={styles.field}>
          <Text style={styles.label}>Квартира</Text>
          <TextInput
            style={styles.input}
            value={formData.apartment}
            onChangeText={(text) => setFormData(prev => ({ ...prev, apartment: text }))}
            placeholder="12"
            keyboardType="numeric"
          />
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={styles.label}>Примітки</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            placeholder="Додаткова інформація..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, createSavedAddress.isPending && styles.disabledButton]}
          onPress={handleSave}
          disabled={createSavedAddress.isPending}
        >
          {createSavedAddress.isPending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Зберегти адресу</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Додати {typeOption?.label.toLowerCase() || 'адресу'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Address Type Info */}
        <View style={styles.typeInfo}>
          <Ionicons 
            name={typeOption?.icon as any} 
            size={24} 
            color={Colors.primary} 
          />
          <Text style={styles.typeText}>
            {type === 'home' && 'Додайте домашню адресу для швидкого доступу'}
            {type === 'work' && 'Додайте робочу адресу для зручних поїздок'}
            {type === 'favorite' && 'Додайте улюблене місце для частих візитів'}
          </Text>
        </View>

        {/* Address Search */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Пошук адреси</Text>
          <AddressSearch
            placeholder="Введіть адресу або місце"
            onSelect={handleAddressSelect}
          />
        </View>

        {/* Selected Address */}
        {selectedAddress && (
          <View style={styles.selectedAddress}>
            <Text style={styles.sectionTitle}>Обрана адреса</Text>
            <View style={styles.addressPreview}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text style={styles.addressText}>{selectedAddress.address}</Text>
            </View>
          </View>
        )}

        {/* Details Form */}
        {renderDetailsForm()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  
  // Type Info
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  typeText: {
    flex: 1,
    fontSize: 14,
    color: Colors.grayText,
    marginLeft: 12,
    lineHeight: 20,
  },
  
  // Sections
  searchSection: {
    marginBottom: 16,
  },
  selectedAddress: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },
  
  // Address Preview
  addressPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: Colors.black,
    marginLeft: 12,
  },
  
  // Details Form
  detailsForm: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  field: {
    marginBottom: 16,
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
    color: Colors.black,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  
  // Save Button
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
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
