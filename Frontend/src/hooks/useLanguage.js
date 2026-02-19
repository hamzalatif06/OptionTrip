import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

/**
 * Custom hook for language management
 * Provides language switching functionality with localStorage persistence
 */
export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  /**
   * Change the current language
   * @param {string} lng - Language code (e.g., 'en', 'ar', 'zh')
   */
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  /**
   * Get the current language
   * @returns {string} Current language code
   */
  const getCurrentLanguage = () => {
    return i18n.language || localStorage.getItem('i18nextLng') || 'en';
  };

  /**
   * Check if current language is RTL
   * @returns {boolean}
   */
  const isRTL = () => {
    const rtlLanguages = ['ar'];
    return rtlLanguages.includes(getCurrentLanguage());
  };

  // Set document direction on language change
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const currentLang = i18n.language || localStorage.getItem('i18nextLng') || 'en';
    const rtlLanguages = ['ar'];

    if (rtlLanguages.includes(currentLang)) {
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', currentLang);
      body.style.direction = 'rtl';
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', currentLang);
      body.style.direction = 'ltr';
    }
  }, [i18n.language]);

  return {
    currentLanguage: getCurrentLanguage(),
    changeLanguage,
    isRTL: isRTL(),
    t, // translation function
    i18n, // i18n instance for advanced usage
  };
};

export default useLanguage;

