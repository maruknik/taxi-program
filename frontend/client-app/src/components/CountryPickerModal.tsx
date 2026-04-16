import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { Colors } from "@/src/constants/theme";
import { styles } from "@/src/styles/countryPicker.styles";
import { COUNTRIES, Country } from "@/src/utils/countries";
import { CloseMDIcon, SearchIcon } from "@/src/components/icons";

interface CountryPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
}

export default function CountryPickerModal({
  visible,
  onClose,
  onSelect,
}: CountryPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.code.includes(searchQuery)
  );

  const handleSelect = (country: Country) => {
    onSelect(country);
    onClose();
    setSearchQuery(""); // скидаємо пошук при закритті
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <CloseMDIcon size={24} color={Colors.black} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <SearchIcon size={20} color={Colors.grayText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ваша країна?"
            placeholderTextColor={Colors.grayText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredCountries}
          keyExtractor={(item) => item.code + item.name}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.countryItem}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.countryItemFlag}>{item.flag}</Text>
              <Text style={styles.countryItemName}>
                {item.name} ({item.code})
              </Text>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
}
