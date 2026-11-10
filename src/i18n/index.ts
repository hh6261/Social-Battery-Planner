import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import hr from './locales/hr.json';
import de from './locales/de.json';

export const SUPPORTED_LOCALES = ['en', 'hr', 'de'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

// Starting language: the phone's language if we support it, otherwise English.
// Later, the saved choice in user_profile will override this.
const deviceLang = getLocales()[0]?.languageCode ?? 'en';
const initialLang: AppLocale = SUPPORTED_LOCALES.includes(deviceLang as AppLocale)
  ? (deviceLang as AppLocale)
  : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hr: { translation: hr },
    de: { translation: de },
  },
  lng: initialLang,
  fallbackLng: 'en', // missing key in hr or de falls back to en
  supportedLngs: [...SUPPORTED_LOCALES],
  interpolation: { escapeValue: false }, // React already escapes
  saveMissing: __DEV__, // only report missing keys in development
  missingKeyHandler: (_langs, _ns, key) => {
    if (__DEV__) console.warn(`[i18n] Missing translation key: ${key}`);
  },
});

export default i18n;