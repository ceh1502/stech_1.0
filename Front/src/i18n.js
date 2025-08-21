// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ko from './locales/ko/translation.json';
import en from './locales/en/translation.json';

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
  },
  lng: 'en',         
  fallbackLng: 'ko', 
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
