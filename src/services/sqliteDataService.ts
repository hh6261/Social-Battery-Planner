/**
 * DataService backed by the app's on-device SQLite database (src/db).
 * The screens only see the DataService interface; all SQL lives in src/db.
 */
import {
  createAccount,
  deleteAllUserData,
  endSession,
  getAccount,
  getActiveSession,
  hasAccount,
  setPassword,
  startSession,
  verifyCredentials,
} from '../db/account';
import { listCheckInsInRange } from '../db/checkIns';
import { getDb } from '../db/client';
import { listJournalEntries } from '../db/journal';
import * as preferences from '../db/preferences';
import * as settings from '../db/settings';
import { getProfile, markOnboarded, setDisplayName, setPhotoUri } from '../db/userProfile';
import { deleteAvatar, persistAvatar } from '../utils/avatarStorage';
import { DataService, ServiceError, Session, User } from './types';

/** There is one local user, so the id is fixed. */
const LOCAL_USER_ID = 'local';

async function loadUser(): Promise<User> {
  const [account, profile] = await Promise.all([getAccount(), getProfile()]);
  if (!account) throw new ServiceError('not_found');
  return {
    id: LOCAL_USER_ID,
    username: profile.displayName ?? '',
    email: account.email,
    birthday: profile.birthday ?? '',
    photoUri: profile.photoUri,
    createdAt: account.createdAtUtc,
  };
}

async function loadSession(): Promise<Session> {
  const [user, profile] = await Promise.all([loadUser(), getProfile()]);
  return { user, token: LOCAL_USER_ID, onboarded: profile.onboardedAtUtc !== null };
}

/** Wrap unexpected DB errors so screens show a friendly message. */
async function guard<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (e) {
    if (e instanceof ServiceError) throw e;
    if (__DEV__) console.warn('[sqliteDataService]', e);
    throw new ServiceError('unknown');
  }
}

export function createSqliteDataService(): DataService {
  return {
    getSession: () =>
      guard(async () => {
        const session = await getActiveSession();
        if (!session) return null;
        // "Remember me" was off: the session only lasts until the app is closed.
        if (!session.remember || !(await hasAccount())) {
          await endSession();
          return null;
        }
        return loadSession();
      }),

    signIn: (email, password, remember) =>
      guard(async () => {
        if (!(await hasAccount())) {
          throw new ServiceError('no_account');
        }
        if (!(await verifyCredentials(email, password))) {
          throw new ServiceError('invalid_credentials');
        }
        await startSession(remember);
        return loadSession();
      }),

    register: (input) =>
      guard(async () => {
        if (await hasAccount()) {
          throw new ServiceError('account_exists');
        }
        const photoUri = persistAvatar(input.photoUri);
        await createAccount({
          email: input.email,
          password: input.password,
          displayName: input.username,
          birthday: input.birthday,
          photoUri,
        });
        await startSession(true);
        return loadSession();
      }),

    resetPassword: (email, birthday, newPassword) =>
      guard(async () => {
        const [account, profile] = await Promise.all([getAccount(), getProfile()]);
        const matches =
          !!account &&
          account.email.toLowerCase() === email.trim().toLowerCase() &&
          profile.birthday === birthday;
        if (!matches) {
          throw new ServiceError('invalid_credentials');
        }
        await setPassword(newPassword);
      }),

    signOut: () => guard(() => endSession()),

    deleteAccount: () =>
      guard(async () => {
        const { photoUri } = await getProfile();
        await deleteAllUserData();
        deleteAvatar(photoUri);
      }),

    updateUser: (_userId, patch) =>
      guard(async () => {
        if (patch.username !== undefined) await setDisplayName(patch.username.trim());
        if (patch.photoUri !== undefined) {
          const { photoUri: oldUri } = await getProfile();
          const newUri = persistAvatar(patch.photoUri);
          if (newUri !== oldUri) {
            await setPhotoUri(newUri);
            deleteAvatar(oldUri);
          }
        }
        return loadUser();
      }),

    completeOnboarding: () => guard(() => markOnboarded()),

    getPreferences: () => guard(() => preferences.getPreferences()),
    savePreferences: (_userId, prefs) => guard(() => preferences.savePreferences(prefs)),

    getSettings: () => guard(() => settings.getSettings()),
    saveSettings: (_userId, value) => guard(() => settings.saveSettings(value)),

    exportData: () =>
      guard(async () => {
        const db = await getDb();
        const [user, prefs, appSettings, checkIns, journal, events, reflections] = await Promise.all([
          loadUser(),
          preferences.getPreferences(),
          settings.getSettings(),
          listCheckInsInRange(new Date(0), new Date(8.64e15)),
          listJournalEntries(100000, 0),
          db.getAllAsync('SELECT * FROM event ORDER BY starts_at_utc'),
          db.getAllAsync('SELECT * FROM event_reflection ORDER BY created_at_utc'),
        ]);
        // Password hash/salt are deliberately left out.
        return JSON.stringify(
          {
            exportedAtUtc: new Date().toISOString(),
            profile: { username: user.username, email: user.email, birthday: user.birthday, createdAt: user.createdAt },
            preferences: prefs,
            settings: appSettings,
            checkIns,
            journal,
            events,
            eventReflections: reflections,
          },
          null,
          2,
        );
      }),
  };
}
