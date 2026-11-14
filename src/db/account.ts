import * as Crypto from 'expo-crypto';
import { getDb } from './client';
import { nowUtc } from './time';
import type { AccountRecord, AuthSessionRecord } from './types';

// The account exists only on this device (there is no server), so the password
// works as a lock on the app rather than as cloud security. It is stored as a
// salted SHA-256 hash, never as plain text.

type AccountRow = {
  email: string;
  password_hash: string;
  password_salt: string;
  created_at_utc: string;
  updated_at_utc: string;
};

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

function newSalt(): string {
  return toHex(Crypto.getRandomBytes(16));
}

function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

export async function getAccount(): Promise<AccountRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<AccountRow>('SELECT * FROM account WHERE id = 1');
  return row ? { email: row.email, createdAtUtc: row.created_at_utc, updatedAtUtc: row.updated_at_utc } : null;
}

export async function hasAccount(): Promise<boolean> {
  return (await getAccount()) !== null;
}

export type NewAccount = {
  email: string;
  password: string;
  displayName: string;
  birthday: string; // yyyy-mm-dd
  photoUri: string | null;
};

/** Creates the account and fills in the profile in one transaction. Throws if one already exists. */
export async function createAccount(input: NewAccount): Promise<void> {
  if (await hasAccount()) throw new Error('An account already exists on this device');
  const db = await getDb();
  const salt = newSalt();
  const hash = await hashPassword(input.password, salt);
  const ts = nowUtc();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO account (id, email, password_hash, password_salt, created_at_utc, updated_at_utc) VALUES (1, ?, ?, ?, ?, ?)',
      [input.email.trim().toLowerCase(), hash, salt, ts, ts],
    );
    await db.runAsync(
      `UPDATE user_profile
         SET display_name = ?, birthday = ?, photo_uri = ?, onboarded_at_utc = NULL, updated_at_utc = ?
       WHERE id = 1`,
      [input.displayName.trim(), input.birthday, input.photoUri, ts],
    );
  });
}

/** True when the email (case-insensitive) and password match the account on this device. */
export async function verifyCredentials(email: string, password: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<AccountRow>('SELECT * FROM account WHERE id = 1 AND email = ?', [
    email.trim(),
  ]);
  if (!row) return false;
  return (await hashPassword(password, row.password_salt)) === row.password_hash;
}

export async function setPassword(password: string): Promise<void> {
  const db = await getDb();
  const salt = newSalt();
  const hash = await hashPassword(password, salt);
  await db.runAsync('UPDATE account SET password_hash = ?, password_salt = ?, updated_at_utc = ? WHERE id = 1', [
    hash,
    salt,
    nowUtc(),
  ]);
}

// ---------- session ----------

export async function startSession(remember: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO auth_session (id, remember, signed_in_at_utc) VALUES (1, ?, ?)', [
    remember ? 1 : 0,
    nowUtc(),
  ]);
}

export async function getActiveSession(): Promise<AuthSessionRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ remember: number; signed_in_at_utc: string }>(
    'SELECT remember, signed_in_at_utc FROM auth_session WHERE id = 1',
  );
  return row ? { remember: row.remember === 1, signedInAtUtc: row.signed_in_at_utc } : null;
}

export async function endSession(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM auth_session WHERE id = 1');
}

// ---------- delete account ----------

/**
 * "Delete account" from Privacy & Data: removes the account, check-ins, plans, journal
 * and preferences, and resets the profile and settings. Reference data (mood,
 * event_type) is kept because it isn't the user's personal data.
 */
export async function deleteAllUserData(): Promise<void> {
  const db = await getDb();
  const ts = nowUtc();
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM journal_entry;
      DELETE FROM check_in;          -- cascades to check_in_mood
      DELETE FROM event;             -- cascades to event_reflection
      DELETE FROM weather_cache;
      DELETE FROM situation;
      DELETE FROM auth_session;
      DELETE FROM account;
      DELETE FROM user_settings;
    `);
    await db.runAsync('INSERT INTO user_settings (id, updated_at_utc) VALUES (1, ?)', [ts]);
    await db.runAsync(
      `UPDATE user_profile
         SET display_name = NULL, birthday = NULL, photo_uri = NULL, onboarded_at_utc = NULL, updated_at_utc = ?
       WHERE id = 1`,
      [ts],
    );
  });
}
