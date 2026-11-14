// Migration 003: local account, session, stressors/relaxers and settings for the
// First run (Hana) + Profile screens. Keep docs/erd.md in sync with this file.
//
// The app is single-user and offline: the account lives only on this device,
// so like user_profile, `account`, `auth_session` and `user_settings` are single-row tables.
export const migration003 = {
  version: 3,
  sql: `
ALTER TABLE user_profile ADD COLUMN birthday TEXT;           -- yyyy-mm-dd
ALTER TABLE user_profile ADD COLUMN photo_uri TEXT;          -- file in the app's document folder
ALTER TABLE user_profile ADD COLUMN onboarded_at_utc TEXT;   -- NULL until personalization is finished

CREATE TABLE account (
  id              INTEGER PRIMARY KEY CHECK (id = 1),      -- single-row table
  email           TEXT NOT NULL COLLATE NOCASE,
  password_hash   TEXT NOT NULL,                           -- SHA-256 of salt + password
  password_salt   TEXT NOT NULL,
  created_at_utc  TEXT NOT NULL,
  updated_at_utc  TEXT NOT NULL
);

CREATE TABLE auth_session (
  id                INTEGER PRIMARY KEY CHECK (id = 1),    -- row exists = signed in
  remember          INTEGER NOT NULL CHECK (remember IN (0, 1)),
  signed_in_at_utc  TEXT NOT NULL
);

CREATE TABLE situation (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  kind            TEXT NOT NULL CHECK (kind IN ('drain', 'recharge')),   -- stressor / relaxer
  label           TEXT NOT NULL,
  level           TEXT NOT NULL CHECK (level IN ('low', 'moderate', 'strong')),
  is_custom       INTEGER NOT NULL DEFAULT 0 CHECK (is_custom IN (0, 1)),
  created_at_utc  TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_situation_kind_label ON situation(kind, label COLLATE NOCASE);

CREATE TABLE user_settings (
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
  theme                   TEXT NOT NULL DEFAULT 'device' CHECK (theme IN ('device', 'light', 'dark')),
  font_size               TEXT NOT NULL DEFAULT 'regular' CHECK (font_size IN ('small', 'regular', 'large')),
  connect_messages        INTEGER NOT NULL DEFAULT 0 CHECK (connect_messages IN (0, 1)),
  connect_calendar        INTEGER NOT NULL DEFAULT 1 CHECK (connect_calendar IN (0, 1)),
  connect_photos          INTEGER NOT NULL DEFAULT 0 CHECK (connect_photos IN (0, 1)),
  updated_at_utc          TEXT NOT NULL
);

INSERT INTO user_settings (id, updated_at_utc) VALUES (1, strftime('%Y-%m-%dT%H:%M:%fZ','now'));
`,
};
