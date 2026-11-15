import i18n, { use } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';

import en from './locales/en.json';
import hr from './locales/hr.json';
import de from './locales/de.json';
import ar from './locales/ar.json';

export const SUPPORTED_LOCALES = ['en', 'hr', 'de', 'ar'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

/** Languages written right to left. The screens flip automatically once the layout direction is set. */
const RTL_LOCALES: readonly string[] = ['ar'];
export const isRtlLocale = (locale: string): boolean => RTL_LOCALES.includes(locale);

/**
 * Sets the layout direction for a language. React Native only applies a new direction after the app
 * restarts, so this returns true when the direction changed and a restart is needed.
 */
export function applyLayoutDirection(locale: string): boolean {
  const rtl = isRtlLocale(locale);
  I18nManager.allowRTL(true);
  if (I18nManager.isRTL === rtl) return false;
  I18nManager.forceRTL(rtl);
  return true;
}

// Starting language: the phone's language if we support it, otherwise English.
// Later, the saved choice in user_profile will override this.
const deviceLang = getLocales()[0]?.languageCode ?? 'en';
const initialLang: AppLocale = SUPPORTED_LOCALES.includes(deviceLang as AppLocale)
  ? (deviceLang as AppLocale)
  : 'en';

// Let the layout follow the language on the very first launch too (takes effect after a restart).
applyLayoutDirection(initialLang);

void use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hr: { translation: hr },
    de: { translation: de },
    ar: { translation: ar },
  },
  lng: initialLang,
  fallbackLng: 'en', // a key missing in hr, de or ar falls back to en
  supportedLngs: [...SUPPORTED_LOCALES],
  interpolation: { escapeValue: false }, // React already escapes
  saveMissing: __DEV__, // only report missing keys in development
  missingKeyHandler: (_langs, _ns, key) => {
    if (__DEV__) console.warn(`[i18n] Missing translation key: ${key}`);
  },
});

export default i18n;
