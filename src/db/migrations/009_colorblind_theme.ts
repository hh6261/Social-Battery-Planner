// Migration 009: Settings > Theme gets a fourth option, 'colorblind'.
// SQLite cannot change a CHECK constraint, so the single-row user_settings table is rebuilt
// with the new list and the old row is copied over. Keep docs/erd.md in sync with this file.
export const migration009 = {
  version: 9,
  sql: `
CREATE TABLE user_settings_new (
  id                      INTEGER PRIMARY KEY CHECK (id = 1),   -- single-row table
  reminders_enabled       INTEGER NOT NULL DEFAULT 1 CHECK (reminders_enabled IN (0, 1)),
  reminder_frequency      TEXT NOT NULL DEFAULT 'every_day'
                            CHECK (reminder_frequency IN ('every_day', 'weekdays', 'weekends', 'weekly')),
  reminder_time           TEXT NOT NULL DEFAULT '18:00' CHECK (reminder_time GLOB '[0-2][0-9]:[0-5][0-9]'),
  include_drain_estimate  INTEGER NOT NULL DEFAULT 1 CHECK (include_drain_estimate IN (0, 1)),
  plan_reminders          INTEGER NOT NULL DEFAULT 1 CHECK (plan_reminders IN (0, 1)),
  quiet_from              TEXT NOT NULL DEFAULT '21:00' CHECK (quiet_from GLOB '[0-2][0-9]:[0-5][0-9]'),
  quiet_to                TEXT NOT NULL DEFAULT '08:00' CHECK (quiet_to GLOB '[0-2][0-9]:[0-5][0-9]'),
  quiet_frequency         TEXT NOT NULL DEFAULT 'every_day'
                            CHECK (quiet_frequency IN ('every_day', 'weekdays', 'weekends', 'weekly')),
  theme                   TEXT NOT NULL DEFAULT 'device'
                            CHECK (theme IN ('device', 'light', 'dark', 'colorblind')),
  font_size               TEXT NOT NULL DEFAULT 'regular' CHECK (font_size IN ('small', 'regular', 'large')),
  connect_messages        INTEGER NOT NULL DEFAULT 0 CHECK (connect_messages IN (0, 1)),
  connect_calendar        INTEGER NOT NULL DEFAULT 1 CHECK (connect_calendar IN (0, 1)),
  connect_photos          INTEGER NOT NULL DEFAULT 0 CHECK (connect_photos IN (0, 1)),
  updated_at_utc          TEXT NOT NULL
);

INSERT INTO user_settings_new
  (id, reminders_enabled, reminder_frequency, reminder_time, include_drain_estimate, plan_reminders,
   quiet_from, quiet_to, quiet_frequency, theme, font_size,
   connect_messages, connect_calendar, connect_photos, updated_at_utc)
SELECT
   id, reminders_enabled, reminder_frequency, reminder_time, include_drain_estimate, plan_reminders,
   quiet_from, quiet_to, quiet_frequency, theme, font_size,
   connect_messages, connect_calendar, connect_photos, updated_at_utc
FROM user_settings;

DROP TABLE user_settings;
ALTER TABLE user_settings_new RENAME TO user_settings;
`,
};
