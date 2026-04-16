import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/api';
import { languageService, SupportedLanguage, SUPPORTED_LANGUAGES } from '@/src/i18n';
import { useLanguageContext } from '@/src/context/LanguageContext';

export function useLanguage() {
  const { currentLanguage, setLanguage } = useLanguageContext();

  const changeLanguage = async (language: SupportedLanguage) => {
    await setLanguage(language);
  };

  return {
    currentLanguage,
    isInitialized: true,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    getCurrentLanguageInfo: () => languageService.getLanguageInfo(currentLanguage),
  };
}

export function useUpdateUserLanguage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (language: SupportedLanguage) => {
      const response = await apiClient.patch('/users/language/', { language });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}
