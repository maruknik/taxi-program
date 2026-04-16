import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { SupportedLanguage, SUPPORTED_LANGUAGES, t } from '@/src/i18n';
import { useLanguage, useUpdateUserLanguage } from '@/src/hooks/useLanguage';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguageSelector({ visible, onClose }: LanguageSelectorProps) {
  const { currentLanguage, changeLanguage } = useLanguage();
  const updateUserLanguage = useUpdateUserLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(language =>
    language.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    language.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectLanguage = async (language: SupportedLanguage) => {
    try {
      await changeLanguage(language);
      updateUserLanguage.mutate(language);
      onClose();
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  const renderLanguageItem = ({ item }: { item: typeof SUPPORTED_LANGUAGES[0] }) => {
    const isSelected = item.code === currentLanguage;

    return (
      <TouchableOpacity
        style={[styles.languageItem, isSelected && styles.selectedItem]}
        onPress={() => handleSelectLanguage(item.code)}
      >
        <View style={styles.languageInfo}>
          <Text style={styles.flag}>{item.flag}</Text>
          <View style={styles.languageText}>
            <Text style={[styles.nativeName, isSelected && styles.selectedText]}>
              {item.nativeName}
            </Text>
            <Text style={[styles.englishName, isSelected && styles.selectedSubtext]}>
              {item.name}
            </Text>
          </View>
        </View>
        
        {isSelected && (
          <Ionicons name="checkmark" size={24} color={Colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('language.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={Colors.grayText} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('language.searchPlaceholder')}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={Colors.grayText} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Language List */}
        <FlatList
          data={filteredLanguages}
          renderItem={renderLanguageItem}
          keyExtractor={(item) => item.code}
          style={styles.languageList}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
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

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.lightGray,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.black,
  },

  // Language List
  languageList: {
    flex: 1,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  selectedItem: {
    backgroundColor: Colors.lightGray,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 24,
    marginRight: 16,
  },
  languageText: {
    flex: 1,
  },
  nativeName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
  },
  selectedText: {
    color: Colors.primary,
  },
  englishName: {
    fontSize: 14,
    color: Colors.grayText,
    marginTop: 2,
  },
  selectedSubtext: {
    color: Colors.primary,
  },
});
