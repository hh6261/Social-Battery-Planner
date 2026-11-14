import type {
  FontSizePreference,
  ReminderFrequency,
  ThemePreference,
  UserSettings,
} from '../services/types';
import { getDb } from './client';
import { nowUtc } from './time';

// Settings, Reminders and Privacy & Data toggles. Single row (id = 1); the
// column DEFAULTs in migration 003 are the app's default settings.

type Row = {
  reminders_enabled: number;
  reminder_frequency: ReminderFrequency;
  reminder_time: string;
  include_drain_estimate: number;
  plan_reminders: number;
  quiet_from: string;
  quiet_to: string;
  quiet_frequency: ReminderFrequency;
  theme: ThemePreference;
  font_size: FontSizePreference;
  connect_messages: number;
  connect_calendar: number;
  connect_photos: number;
  updated_at_utc: string;
};

const bool = (n: number) => n === 1;
const int = (b: boolean) => (b ? 1 : 0);

function toSettings(r: Row): UserSettings {
  return {
    reminders: {
      enabled: bool(r.reminders_enabled),
      frequency: r.reminder_frequency,
      time: r.reminder_time,
      includeDrainEstimate: bool(r.include_drain_estimate),
      planReminders: bool(r.plan_reminders),
    },
    quietHours: { from: r.quiet_from, to: r.quiet_to, frequency: r.quiet_frequency },
    display: { theme: r.theme, fontSize: r.font_size },
    connections: {
      messages: bool(r.connect_messages),
      calendar: bool(r.connect_calendar),
      photos: bool(r.connect_photos),
    },
  };
}

export async function getSettings(): Promise<UserSettings> {
  const db = await getDb();
  let row = await db.getFirstAsync<Row>('SELECT * FROM user_settings WHERE id = 1');
  if (!row) {
    // Shouldn't happen (migration 003 inserts it), but recover with the defaults.
    await db.runAsync('INSERT OR IGNORE INTO user_settings (id, updated_at_utc) VALUES (1, ?)', [nowUtc()]);
    row = await db.getFirstAsync<Row>('SELECT * FROM user_settings WHERE id = 1');
    if (!row) throw new Error('user_settings row missing (migration 003 not applied?)');
  }
  return toSettings(row);
}

export async function saveSettings(s: UserSettings): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE user_settings SET
       reminders_enabled = ?, reminder_frequency = ?, reminder_time = ?,
       include_drain_estimate = ?, plan_reminders = ?,
       quiet_from = ?, quiet_to = ?, quiet_frequency = ?,
       theme = ?, font_size = ?,
       connect_messages = ?, connect_calendar = ?, connect_photos = ?,
       updated_at_utc = ?
     WHERE id = 1`,
    [
      int(s.reminders.enabled),
      s.reminders.frequency,
      s.reminders.time,
      int(s.reminders.includeDrainEstimate),
      int(s.reminders.planReminders),
      s.quietHours.from,
      s.quietHours.to,
      s.quietHours.frequency,
      s.display.theme,
      s.display.fontSize,
      int(s.connections.messages),
      int(s.connections.calendar),
      int(s.connections.photos),
      nowUtc(),
    ],
  );
}
