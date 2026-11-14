import i18n, { applyLayoutDirection, SUPPORTED_LOCALES, AppLocale } from './index';
import { getProfile, setLocale } from '../db/userProfile';

const isSupported = (value: string): value is AppLocale =>
  SUPPORTED_LOCALES.includes(value as AppLocale);

/** Call once at startup, after the database is ready. */
export async function loadSavedLocale(): Promise<void> {
  const profile = await getProfile();
  if (isSupported(profile.locale)) {
    applyLayoutDirection(profile.locale);
    if (profile.locale !== i18n.language) await i18n.changeLanguage(profile.locale);
  }
}

/**
 * Use this everywhere the user picks a language (Settings).
 * Resolves true when the text direction changed (English <-> Arabic), which needs an app restart.
 */
export async function changeLocale(locale: AppLocale): Promise<boolean> {
  await i18n.changeLanguage(locale);
  await setLocale(locale);
  return applyLayoutDirection(locale);
}
