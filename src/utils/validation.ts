import { PASSWORD_MIN_LENGTH } from '../constants/config';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Please enter your email address.';
  if (!EMAIL_RE.test(email.trim())) return 'That doesn’t look like an email address.';
  return null;
}

export function validateNewPassword(password: string): string | null {
  if (!password) return 'Please create a password.';
  if (password.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Use at least one letter and one number.';
  return null;
}

export function validateUsername(username: string): string | null {
  const name = username.trim();
  if (!name) return 'Please choose a username.';
  if (name.length < 2) return 'Use at least 2 characters.';
  if (name.length > 30) return 'Use 30 characters or fewer.';
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
  if (!day || !month || !year) return { iso: null, error: 'Please enter your full birthday.' };
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y) || year.length !== 4) {
    return { iso: null, error: 'Please use DD / MM / YYYY.' };
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  const real = date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  if (!real || y < 1900) return { iso: null, error: 'That date doesn’t exist.' };

  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (date.getTime() > todayUtc) return { iso: null, error: 'Your birthday can’t be in the future.' };

  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1;
  if (age < MIN_AGE) return { iso: null, error: `You need to be at least ${MIN_AGE} to use Social Battery.` };

  const pad = (n: number) => String(n).padStart(2, '0');
  return { iso: `${y}-${pad(m)}-${pad(d)}`, error: null };
}
