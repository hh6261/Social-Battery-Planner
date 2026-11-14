import { getDb } from './client';
import { nowUtc } from './time';
import type { UserProfile } from './types';

type Row = {
  id: 1;
  display_name: string | null;
  locale: string;
  birthday: string | null;
  photo_uri: string | null;
  onboarded_at_utc: string | null;
  created_at_utc: string;
  updated_at_utc: string;
};

export async function getProfile(): Promise<UserProfile> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>('SELECT * FROM user_profile WHERE id = 1');
  if (!row) throw new Error('user_profile row missing (migration 001 not applied?)');
  return {
    id: 1,
    displayName: row.display_name,
    locale: row.locale,
    birthday: row.birthday,
    photoUri: row.photo_uri,
    onboardedAtUtc: row.onboarded_at_utc,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  };
}

/** Persist the language choice so it survives an app restart. */
export async function setLocale(locale: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE user_profile SET locale = ?, updated_at_utc = ? WHERE id = 1', [locale, nowUtc()]);
}

export async function setDisplayName(displayName: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE user_profile SET display_name = ?, updated_at_utc = ? WHERE id = 1', [
    displayName,
    nowUtc(),
  ]);
}

export async function setPhotoUri(photoUri: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE user_profile SET photo_uri = ?, updated_at_utc = ? WHERE id = 1', [photoUri, nowUtc()]);
}

/** Called when the user taps Finish on the personalization screen. */
export async function markOnboarded(): Promise<void> {
  const db = await getDb();
  const ts = nowUtc();
  await db.runAsync('UPDATE user_profile SET onboarded_at_utc = ?, updated_at_utc = ? WHERE id = 1', [ts, ts]);
}
