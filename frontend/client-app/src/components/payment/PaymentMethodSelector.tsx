import React from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { usePaymentMethods } from '@/src/hooks/usePaymentMethods';
import { PaymentMethod, PaymentMethodSelectorProps } from '@/src/types/payment.types';

export function PaymentMethodSelector({ 
  visible, 
  onClose, 
  onSelect, 
  onAddCard, 
  selectedMethodId 
}: PaymentMethodSelectorProps) {
  const { data: methods = [], isLoading } = usePaymentMethods();

  const renderPaymentMethod = ({ item }: { item: PaymentMethod }) => {
    const isSelected = item.id === selectedMethodId;
    
    return (
      <TouchableOpacity
        style={[
          styles.methodItem,
          isSelected && styles.selectedMethodItem
        ]}
        onPress={() => onSelect(item)}
      >
        <View style={styles.methodInfo}>
          <Ionicons 
            name={item.type === 'cash' ? 'cash-outline' : 'card-outline'} 
            size={24} 
            color={isSelected ? Colors.primary : Colors.grayText} 
          />
          <View style={styles.methodText}>
            <Text style={[
              styles.methodName,
              isSelected && styles.selectedMethodName
            ]}>
              {item.display_name}
            </Text>
            {item.is_default && (
              <Text style={styles.defaultLabel}>За замовчуванням</Text>
            )}
          </View>
        </View>
        
        {isSelected && (
          <Ionicons 
            name="checkmark-circle" 
            size={24} 
            color={Colors.primary} 
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Способи оплати</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Payment Methods List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text>Завантаження...</Text>
          </View>
        ) : (
          <FlatList
            data={methods}
            keyExtractor={(item) => item.id}
            renderItem={renderPaymentMethod}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Add Card Button */}
        <TouchableOpacity
          style={styles.addCardButton}
          onPress={onAddCard}
        >
          <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
          <Text style={styles.addCardText}>Додати картку</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  placeholder: {
    width: 32,
  },

  // List
  list: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Payment Method Item
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  selectedMethodItem: {
    backgroundColor: '#6B38FB10', // Colors.primary with 10% opacity
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodText: {
    marginLeft: 12,
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
  },
  selectedMethodName: {
    color: Colors.primary,
    fontWeight: '600',
  },
  defaultLabel: {
    fontSize: 12,
    color: Colors.grayText,
    marginTop: 2,
  },

  // Add Card Button
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
  },
  addCardText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
});
