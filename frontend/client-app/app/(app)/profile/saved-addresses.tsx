import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { useGroupedAddresses, useDeleteSavedAddress } from '@/src/hooks/useSavedAddresses';
import { SavedAddress, ADDRESS_TYPE_OPTIONS } from '@/src/types/address.types';

export default function SavedAddressesScreen() {
  const router = useRouter();
  const { data: addresses, isLoading } = useGroupedAddresses();
  const deleteSavedAddress = useDeleteSavedAddress();

  const handleAddAddress = (type: string) => {
    router.push({
      pathname: '/profile/add-address',
      params: { type }
    });
  };

  const handleEditAddress = (address: SavedAddress) => {
    router.push({
      pathname: '/profile/edit-address',
      params: { id: address.id }
    });
  };

  const handleDeleteAddress = (address: SavedAddress) => {
    Alert.alert(
      'Видалити адресу?',
      `Ви впевнені що хочете видалити "${address.display_name}"?`,
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSavedAddress.mutateAsync(address.id);
            } catch (error) {
              Alert.alert('Помилка', 'Не вдалося видалити адресу');
            }
          },
        },
      ]
    );
  };

  const renderAddressCard = (address: SavedAddress | null, type: string) => {
    const typeOption = ADDRESS_TYPE_OPTIONS.find(opt => opt.value === type);
    
    if (!address) {
      return (
        <TouchableOpacity
          key={type}
          style={styles.addCard}
          onPress={() => handleAddAddress(type)}
        >
          <View style={styles.addCardContent}>
            <View style={styles.addIconContainer}>
              <Ionicons name="add" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.addCardText}>
              Додати {typeOption?.label.toLowerCase()}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View key={address.id} style={styles.addressCard}>
        <View style={styles.addressHeader}>
          <View style={styles.addressTitle}>
            <Ionicons 
              name={typeOption?.icon as any} 
              size={20} 
              color={Colors.primary} 
            />
            <Text style={styles.addressType}>{address.display_name}</Text>
          </View>
          
          <View style={styles.addressActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditAddress(address)}
            >
              <Ionicons name="create-outline" size={20} color={Colors.grayText} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteAddress(address)}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.addressText}>{address.address}</Text>
        
        {address.full_address !== address.address && (
          <Text style={styles.addressDetails}>{address.full_address}</Text>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Збережені адреси</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Збережені адреси</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Home Address */}
        {renderAddressCard(addresses?.home || null, 'home')}
        
        {/* Work Address */}
        {renderAddressCard(addresses?.work || null, 'work')}
        
        {/* Favorite Addresses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Обрані місця</Text>
          
          {addresses?.favorites && addresses.favorites.length > 0 ? (
            addresses.favorites.map((address) => (
              <View key={address.id} style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <View style={styles.addressTitle}>
                    <Ionicons name="heart" size={20} color={Colors.primary} />
                    <Text style={styles.addressType}>{address.display_name}</Text>
                  </View>
                  
                  <View style={styles.addressActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditAddress(address)}
                    >
                      <Ionicons name="create-outline" size={20} color={Colors.grayText} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteAddress(address)}
                    >
                      <Ionicons name="trash-outline" size={20} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={styles.addressText}>{address.address}</Text>
                
                {address.full_address !== address.address && (
                  <Text style={styles.addressDetails}>{address.full_address}</Text>
                )}
              </View>
            ))
          ) : (
            <TouchableOpacity
              style={styles.addCard}
              onPress={() => handleAddAddress('favorite')}
            >
              <View style={styles.addCardContent}>
                <View style={styles.addIconContainer}>
                  <Ionicons name="add" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.addCardText}>Додати обране місце</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  
  // Address Cards
  addressCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginLeft: 8,
  },
  addressActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: Colors.black,
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 12,
    color: Colors.grayText,
  },
  
  // Add Card
  addCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
  },
  addCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addCardText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  
  // Section
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },
});
