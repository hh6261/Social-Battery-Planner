/**
 * Domain types shared by the screens and the data layer.
 *
 * These mirror what the screens need. When the real database is wired in,
 * map the DB rows to these shapes inside the service adapter so the screens
 * never have to change.
 */

export interface User {
  id: string;
  username: string;
  email: string;
  /** ISO date, yyyy-mm-dd */
  birthday: string;
  photoUri: string | null;
  createdAt: string;
}

export interface Session {
  user: User;
  token: string;
  /** False until the user has finished onboarding + personalization. */
  onboarded: boolean;
}

/** How much energy a situation uses (drains) or gives back (recharges). */
export type EnergyLevel = 'low' | 'moderate' | 'strong';

export type SituationKind = 'drain' | 'recharge';

export interface Situation {
  id: string;
  label: string;
  level: EnergyLevel;
  kind: SituationKind;
  /** True when the user typed it in themselves. */
  custom: boolean;
}

/** "Your stressors" and "Your relaxers" on the Profile screen. */
export interface UserPreferences {
  drains: Situation[];
  recharges: Situation[];
}

export type ReminderFrequency = 'every_day' | 'weekdays' | 'weekends' | 'weekly';
export type ThemePreference = 'device' | 'light' | 'dark';
export type FontSizePreference = 'small' | 'regular' | 'large';

export interface UserSettings {
  reminders: {
    enabled: boolean;
    frequency: ReminderFrequency;
    /** HH:MM, 24h */
    time: string;
    /** Include an estimate of the next day's social battery drain. */
    includeDrainEstimate: boolean;
    /** A heads-up before plans saved in the journal. */
    planReminders: boolean;
  };
  quietHours: {
    /** HH:MM, 24h */
    from: string;
    /** HH:MM, 24h */
    to: string;
    frequency: ReminderFrequency;
  };
  display: {
    theme: ThemePreference;
    fontSize: FontSizePreference;
  };
  connections: {
    messages: boolean;
    calendar: boolean;
    photos: boolean;
  };
}

export interface RegistrationInput {
  username: string;
  email: string;
  password: string;
  /** ISO date, yyyy-mm-dd */
  birthday: string;
  photoUri: string | null;
}

export type UserPatch = Partial<Pick<User, 'username' | 'photoUri'>>;

/** Error type the screens know how to show. `message` is user-facing. */
export class ServiceError extends Error {
  constructor(
    public code:
      | 'invalid_credentials'
      | 'account_exists'
      | 'email_taken'
      | 'username_taken'
      | 'not_found'
      | 'network'
      | 'unknown',
    message: string,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Everything the Hana + Profile screens need from the backend.
 * Implement this once against the real database (see services/index.ts).
 */
export interface DataService {
  /** Restore a remembered session on app start, or null. */
  getSession(): Promise<Session | null>;
  signIn(email: string, password: string, remember: boolean): Promise<Session>;
  register(input: RegistrationInput): Promise<Session>;
  /**
   * The account is stored only on this device, so there's no reset email.
   * The user proves it's them with their email + birthday, then sets a new password.
   * Throws ServiceError('invalid_credentials') when the details don't match.
   */
  resetPassword(email: string, birthday: string, newPassword: string): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount(userId: string): Promise<void>;

  updateUser(userId: string, patch: UserPatch): Promise<User>;
  completeOnboarding(userId: string): Promise<void>;

  getPreferences(userId: string): Promise<UserPreferences>;
  savePreferences(userId: string, prefs: UserPreferences): Promise<void>;

  getSettings(userId: string): Promise<UserSettings>;
  saveSettings(userId: string, settings: UserSettings): Promise<void>;

  /** Everything we hold about the user, as a JSON string. */
  exportData(userId: string): Promise<string>;
}
