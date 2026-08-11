import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  const getCurrentLanguage = () => {
    return i18n.language || localStorage.getItem('i18nextLng') || 'en';
  };

  const isRTL = () => {
    const rtlLanguages = ['ar'];
    return rtlLanguages.includes(getCurrentLanguage());
  };

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
    t,
    i18n,
  };
};

export default useLanguage;

