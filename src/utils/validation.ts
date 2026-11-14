import { PASSWORD_MIN_LENGTH } from '../constants/config';
import i18n from '../i18n';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return i18n.t('validation.emailRequired');
  if (!EMAIL_RE.test(email.trim())) return i18n.t('validation.emailInvalid');
  return null;
}

export function validateNewPassword(password: string): string | null {
  if (!password) return i18n.t('validation.passwordRequired');
  if (password.length < PASSWORD_MIN_LENGTH) return i18n.t('validation.passwordShort', { count: PASSWORD_MIN_LENGTH });
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return i18n.t('validation.passwordWeak');
  return null;
}

export function validateUsername(username: string): string | null {
  const name = username.trim();
  if (!name) return i18n.t('validation.usernameRequired');
  if (name.length < 2) return i18n.t('validation.usernameShort');
  if (name.length > 30) return i18n.t('validation.usernameLong');
  return null;
}

export const MIN_AGE = 13;

/**
 * Validates DD / MM / YYYY and returns an ISO date (yyyy-mm-dd) when valid.
 */
export function parseBirthday(
  day: string,
  month: string,
  year: string,
  today = new Date(),
): { iso: string; error: null } | { iso: null; error: string } {
  if (!day || !month || !year) return { iso: null, error: i18n.t('validation.birthdayRequired') };
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y) || year.length !== 4) {
    return { iso: null, error: i18n.t('validation.birthdayFormat') };
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  const real = date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  if (!real || y < 1900) return { iso: null, error: i18n.t('validation.birthdayInvalid') };

  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (date.getTime() > todayUtc) return { iso: null, error: i18n.t('validation.birthdayFuture') };

  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1;
  if (age < MIN_AGE) return { iso: null, error: i18n.t('validation.birthdayTooYoung', { age: MIN_AGE }) };

  const pad = (n: number) => String(n).padStart(2, '0');
  return { iso: `${y}-${pad(m)}-${pad(d)}`, error: null };
}
