import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import uk from './locales/uk.json';
import en from './locales/en.json';
import pl from './locales/pl.json';
import de from './locales/de.json';
import fr from './locales/fr.json';

export type SupportedLanguage = 'uk' | 'en' | 'pl' | 'de' | 'fr';

export const SUPPORTED_LANGUAGES: Array<{
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}> = [
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

// Create i18n instance
const i18n = new I18n({
  uk,
  en,
  pl,
  de,
  fr,
});

// Set default locale
i18n.defaultLocale = 'uk';
i18n.enableFallback = true;

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = 'user_language';

class LanguageService {
  private static instance: LanguageService;
  private currentLanguage: SupportedLanguage = 'uk';
  private storageAvailable: boolean = true;

  static getInstance(): LanguageService {
    if (!LanguageService.instance) {
      LanguageService.instance = new LanguageService();
    }
    return LanguageService.instance;
  }

  async initializeLanguage(): Promise<SupportedLanguage> {
    try {
      // Try to get saved language preference
      let savedLanguage: string | null = null;
      
      try {
        savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      } catch (storageError) {
        console.warn('AsyncStorage not available, using default language');
        this.storageAvailable = false;
      }
      
      if (savedLanguage && this.isSupportedLanguage(savedLanguage)) {
        this.currentLanguage = savedLanguage as SupportedLanguage;
      } else {
        // Fallback to device locale
        const deviceLocale = Localization.getLocales()[0]?.languageCode || 'uk';
        const deviceLanguage = deviceLocale.split('-')[0];
        
        if (this.isSupportedLanguage(deviceLanguage)) {
          this.currentLanguage = deviceLanguage as SupportedLanguage;
        }
      }
      
      i18n.locale = this.currentLanguage;
      return this.currentLanguage;
    } catch (error) {
      console.error('Failed to initialize language:', error);
      i18n.locale = 'uk';
      return 'uk';
    }
  }

  async setLanguage(language: SupportedLanguage): Promise<void> {
    try {
      this.currentLanguage = language;
      i18n.locale = language;
      
      // Save to storage only if available
      if (this.storageAvailable) {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      }
    } catch (error) {
      console.error('Failed to set language:', error);
    }
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  getLanguageInfo(code: SupportedLanguage) {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  }

  private isSupportedLanguage(language: string): boolean {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === language);
  }
}

export const languageService = LanguageService.getInstance();

// Translation function
export function t(key: string, options?: any): string {
  return i18n.t(key, options);
}

// Export i18n instance for direct use if needed
export { i18n };
