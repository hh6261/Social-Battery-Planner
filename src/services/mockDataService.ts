/**
 * In-memory implementation of DataService for UI work without the database
 * (the app itself uses sqliteDataService). Data resets when the app reloads.
 *
 * Demo account: alex@example.com / password123
 *
 * Not used by default. To try it, switch the export in services/index.ts.
 */
import { DEFAULT_SETTINGS, makeSituation } from '../constants/situations';
import {
  DataService,
  RegistrationInput,
  ServiceError,
  Session,
  User,
  UserPatch,
  UserPreferences,
  UserSettings,
} from './types';

interface StoredAccount {
  user: User;
  password: string; // plain text is acceptable only because this is a local mock
  onboarded: boolean;
  preferences: UserPreferences;
  settings: UserSettings;
}

const LATENCY_MS = 350;
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, LATENCY_MS));
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const normalizeEmail = (email: string) => email.trim().toLowerCase();

function seedAccounts(): Map<string, StoredAccount> {
  const alex: StoredAccount = {
    user: {
      id: 'user-alex',
      username: 'Alex',
      email: 'alex@example.com',
      birthday: '1998-04-12',
      photoUri: null,
      createdAt: new Date().toISOString(),
    },
    password: 'password123',
    onboarded: true,
    preferences: {
      drains: [
        makeSituation('Large gatherings', 'strong', 'drain', false),
        makeSituation('Long social days', 'strong', 'drain', false),
        makeSituation('Meeting new people', 'moderate', 'drain', false),
        makeSituation('Conflict', 'strong', 'drain', false),
      ],
      recharges: [
        makeSituation('Time alone', 'moderate', 'recharge', false),
        makeSituation('Reading quietly', 'moderate', 'recharge', false),
        makeSituation('A gentle walk', 'moderate', 'recharge', false),
        makeSituation('Restful sleep', 'strong', 'recharge', false),
      ],
    },
    settings: clone(DEFAULT_SETTINGS),
  };
  return new Map([[alex.user.id, alex]]);
}

export function createMockDataService(): DataService {
  const accounts = seedAccounts();
  let current: { userId: string; remember: boolean } | null = null;

  const find = (userId: string): StoredAccount => {
    const account = accounts.get(userId);
    if (!account) throw new ServiceError('not_found');
    return account;
  };

  const toSession = (account: StoredAccount): Session => ({
    user: clone(account.user),
    token: `mock-token-${account.user.id}`,
    onboarded: account.onboarded,
  });

  return {
    async getSession() {
      await wait();
      if (!current || !current.remember) return null;
      const account = accounts.get(current.userId);
      return account ? toSession(account) : null;
    },

    async signIn(email, password, remember) {
      await wait();
      const account = [...accounts.values()].find(
        (a) => a.user.email === normalizeEmail(email),
      );
      if (!account || account.password !== password) {
        throw new ServiceError('invalid_credentials');
      }
      current = { userId: account.user.id, remember };
      return toSession(account);
    },

    async register(input: RegistrationInput) {
      await wait();
      const email = normalizeEmail(input.email);
      const all = [...accounts.values()];
      if (all.some((a) => a.user.email === email)) {
        throw new ServiceError('email_taken');
      }
      if (all.some((a) => a.user.username.toLowerCase() === input.username.trim().toLowerCase())) {
        throw new ServiceError('username_taken');
      }
      const id = `user-${Date.now().toString(36)}`;
      const account: StoredAccount = {
        user: {
          id,
          username: input.username.trim(),
          email,
          birthday: input.birthday,
          photoUri: input.photoUri,
          createdAt: new Date().toISOString(),
        },
        password: input.password,
        onboarded: false,
        preferences: { drains: [], recharges: [] },
        settings: clone(DEFAULT_SETTINGS),
      };
      accounts.set(id, account);
      current = { userId: id, remember: true };
      return toSession(account);
    },

    async resetPassword(email, birthday, newPassword) {
      await wait();
      const account = [...accounts.values()].find((a) => a.user.email === normalizeEmail(email));
      if (!account || account.user.birthday !== birthday) {
        throw new ServiceError('invalid_credentials');
      }
      account.password = newPassword;
    },

    async signOut() {
      await wait();
      current = null;
    },

    async deleteAccount(userId) {
      await wait();
      accounts.delete(userId);
      if (current?.userId === userId) current = null;
    },

    async updateUser(userId, patch: UserPatch) {
      await wait();
      const account = find(userId);
      if (patch.username !== undefined) {
        const name = patch.username.trim();
        const taken = [...accounts.values()].some(
          (a) => a.user.id !== userId && a.user.username.toLowerCase() === name.toLowerCase(),
        );
        if (taken) throw new ServiceError('username_taken');
        account.user.username = name;
      }
      if (patch.photoUri !== undefined) account.user.photoUri = patch.photoUri;
      return clone(account.user);
    },

    async completeOnboarding(userId) {
      await wait();
      find(userId).onboarded = true;
    },

    async getPreferences(userId) {
      await wait();
      return clone(find(userId).preferences);
    },

    async savePreferences(userId, prefs) {
      await wait();
      find(userId).preferences = clone(prefs);
    },

    async getSettings(userId) {
      await wait();
      return clone(find(userId).settings);
    },

    async saveSettings(userId, settings) {
      await wait();
      find(userId).settings = clone(settings);
    },

    async exportData(userId) {
      await wait();
      const { password: _omit, ...rest } = find(userId);
      return JSON.stringify({ exportedAt: new Date().toISOString(), ...rest }, null, 2);
    },
  };
}
