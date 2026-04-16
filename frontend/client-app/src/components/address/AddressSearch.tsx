import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { useAddressSearch } from '@/src/hooks/useSavedAddresses';
import { AddressSearchResult } from '@/src/types/address.types';

interface AddressSearchProps {
  placeholder?: string;
  onSelect: (address: AddressSearchResult) => void;
  initialValue?: string;
}

export function AddressSearch({ 
  placeholder = "Введіть адресу", 
  onSelect, 
  initialValue = "" 
}: AddressSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const searchAddresses = useAddressSearch();

  useEffect(() => {
    if (query.length >= 3) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [query]);

  const handleSearch = async () => {
    try {
      const searchResults = await searchAddresses.mutateAsync(query);
      setResults(searchResults);
      setShowResults(true);
    } catch (error) {
      console.error('Address search failed:', error);
      setResults([]);
      setShowResults(false);
    }
  };

  const handleSelectAddress = (address: AddressSearchResult) => {
    setQuery(address.address);
    setShowResults(false);
    onSelect(address);
  };

  const renderAddressItem = ({ item }: { item: AddressSearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectAddress(item)}
    >
      <View style={styles.resultContent}>
        <Ionicons name="location" size={20} color={Colors.primary} />
        <View style={styles.resultText}>
          <Text style={styles.resultAddress} numberOfLines={1}>
            {item.address}
          </Text>
          {item.description && (
            <Text style={styles.resultDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.grayText} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={Colors.grayText}
        />
        {searchAddresses.isPending && (
          <ActivityIndicator size="small" color={Colors.primary} />
        )}
      </View>

      {showResults && results.length > 0 && (
        <View style={styles.resultsContainer}>
          {results.map((item, index) => (
            <React.Fragment key={item.place_id || index}>
              {renderAddressItem({ item })}
              {index < results.length - 1 && <View style={styles.separator} />}
            </React.Fragment>
          ))}
        </View>
      )}

      {showResults && results.length === 0 && !searchAddresses.isPending && query.length >= 3 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Адресу не знайдено</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.black,
  },
  resultsContainer: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: 0,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 16,
  },
  emptyContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.grayText,
  },
  resultItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultText: {
    marginLeft: 12,
    flex: 1,
  },
  resultAddress: {
    fontSize: 16,
    color: Colors.black,
    fontWeight: '500',
  },
  resultDescription: {
    fontSize: 14,
    color: Colors.grayText,
    marginTop: 2,
  },
});
