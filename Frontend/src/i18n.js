import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files
import enTranslations from './locales/en.json';
import ruTranslations from './locales/ru.json';
import deTranslations from './locales/de.json';
import frTranslations from './locales/fr.json';
import itTranslations from './locales/it.json';
import esTranslations from './locales/es.json';
import plTranslations from './locales/pl.json';
import ukTranslations from './locales/uk.json';
import trTranslations from './locales/tr.json';
import huTranslations from './locales/hu.json';
import svTranslations from './locales/sv.json';
import ptTranslations from './locales/pt.json';
import srTranslations from './locales/sr.json';
import arTranslations from './locales/ar.json';
import zhTranslations from './locales/zh.json';
import jaTranslations from './locales/ja.json';
import viTranslations from './locales/vi.json';
import thTranslations from './locales/th.json';
import koTranslations from './locales/ko.json';
import hiTranslations from './locales/hi.json';
import bnTranslations from './locales/bn.json';
import idTranslations from './locales/id.json';

// RTL languages
const rtlLanguages = ['ar'];

// Function to get saved language from localStorage
const getSavedLanguage = () => {
  try {
    const saved = localStorage.getItem('i18nextLng');
    return saved || 'en';
  } catch (e) {
    return 'en';
  }
};

// Function to set document direction based on language
const setDocumentDirection = (lng) => {
  const html = document.documentElement;
  const body = document.body;
  
  if (rtlLanguages.includes(lng)) {
    html.setAttribute('dir', 'rtl');
    html.setAttribute('lang', lng);
    body.style.direction = 'rtl';
  } else {
    html.setAttribute('dir', 'ltr');
    html.setAttribute('lang', lng);
    body.style.direction = 'ltr';
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      ru: { translation: ruTranslations },
      de: { translation: deTranslations },
      fr: { translation: frTranslations },
      it: { translation: itTranslations },
      es: { translation: esTranslations },
      pl: { translation: plTranslations },
      uk: { translation: ukTranslations },
      tr: { translation: trTranslations },
      hu: { translation: huTranslations },
      sv: { translation: svTranslations },
      pt: { translation: ptTranslations },
      sr: { translation: srTranslations },
      ar: { translation: arTranslations },
      zh: { translation: zhTranslations },
      ja: { translation: jaTranslations },
      vi: { translation: viTranslations },
      th: { translation: thTranslations },
      ko: { translation: koTranslations },
      hi: { translation: hiTranslations },
      bn: { translation: bnTranslations },
      id: { translation: idTranslations },
    },
    fallbackLng: 'en',
    lng: getSavedLanguage(),
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

// Set initial direction
setDocumentDirection(i18n.language || getSavedLanguage());

// Listen for language changes
i18n.on('languageChanged', (lng) => {
  setDocumentDirection(lng);
  localStorage.setItem('i18nextLng', lng);
});

export default i18n;

