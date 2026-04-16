import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/theme';
import { useLanguage } from '@/src/hooks/useLanguage';
import { LanguageSelector } from '@/src/components/settings/LanguageSelector';
import { t } from '@/src/i18n';

export default function LanguageScreen() {
  const router = useRouter();
  const { getCurrentLanguageInfo } = useLanguage();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const currentLanguageInfo = getCurrentLanguageInfo();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('language.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.languageOption}
          onPress={() => setShowLanguageSelector(true)}
        >
          <View style={styles.languageInfo}>
            <Text style={styles.flag}>{currentLanguageInfo?.flag}</Text>
            <View style={styles.languageText}>
              <Text style={styles.languageName}>
                {currentLanguageInfo?.nativeName}
              </Text>
              <Text style={styles.languageSubtext}>
                {currentLanguageInfo?.name}
              </Text>
            </View>
          </View>
          
          <Ionicons name="chevron-forward" size={20} color={Colors.grayText} />
        </TouchableOpacity>

        <Text style={styles.description}>
          Оберіть мову для інтерфейсу додатку. Зміни застосуються негайно.
        </Text>
      </View>

      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
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

  // Language Option
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  languageSubtext: {
    fontSize: 14,
    color: Colors.grayText,
    marginTop: 2,
  },

  // Description
  description: {
    fontSize: 14,
    color: Colors.grayText,
    lineHeight: 20,
    textAlign: 'center',
  },
});
