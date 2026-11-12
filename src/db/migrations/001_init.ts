// Migration 001: initial schema. Keep docs/erd.md in sync with this file.
export const migration001 = {
  version: 1,
  sql: `
CREATE TABLE user_profile (
  id              INTEGER PRIMARY KEY CHECK (id = 1),      -- single-row table
  display_name    TEXT,
  locale          TEXT NOT NULL DEFAULT 'en',
  created_at_utc  TEXT NOT NULL,
  updated_at_utc  TEXT NOT NULL
);

CREATE TABLE event_type (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL UNIQUE,
  emoji         TEXT,
  default_drain INTEGER NOT NULL DEFAULT 0 CHECK (default_drain BETWEEN 0 AND 100)
);

CREATE TABLE event (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type_id  INTEGER NOT NULL REFERENCES event_type(id) ON DELETE RESTRICT,
  title          TEXT NOT NULL,
  location       TEXT,
  starts_at_utc  TEXT NOT NULL,
  ends_at_utc    TEXT,
  expected_drain INTEGER CHECK (expected_drain BETWEEN 0 AND 100)
);
CREATE INDEX idx_event_starts ON event(starts_at_utc);

CREATE TABLE event_reflection (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id        INTEGER NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  battery_before  INTEGER CHECK (battery_before BETWEEN 0 AND 100),
  battery_after   INTEGER CHECK (battery_after BETWEEN 0 AND 100),
  note            TEXT,
  created_at_utc  TEXT NOT NULL
);

CREATE TABLE weather_cache (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  location_key    TEXT NOT NULL UNIQUE,
  payload_json    TEXT NOT NULL,
  fetched_at_utc  TEXT NOT NULL
);

CREATE TABLE mood (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  key    TEXT NOT NULL UNIQUE,   -- stable identifier used in code
  label  TEXT NOT NULL           -- default (English) display label
);

CREATE TABLE check_in (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  battery_level   INTEGER NOT NULL CHECK (battery_level BETWEEN 0 AND 100),
  activity        TEXT,
  attendees       TEXT,
  impact_rating   INTEGER CHECK (impact_rating BETWEEN 1 AND 5),
  notes           TEXT,
  event_id        INTEGER REFERENCES event(id) ON DELETE SET NULL,
  created_at_utc  TEXT NOT NULL,
  updated_at_utc  TEXT NOT NULL
);
CREATE INDEX idx_check_in_created ON check_in(created_at_utc);

CREATE TABLE check_in_mood (
  check_in_id  INTEGER NOT NULL REFERENCES check_in(id) ON DELETE CASCADE,
  mood_id      INTEGER NOT NULL REFERENCES mood(id) ON DELETE RESTRICT,
  PRIMARY KEY (check_in_id, mood_id)
);

INSERT INTO mood (key, label) VALUES
  ('calm', 'Calm'),
  ('happy', 'Happy'),
  ('energised', 'Energised'),
  ('content', 'Content'),
  ('tired', 'Tired'),
  ('anxious', 'Anxious'),
  ('irritable', 'Irritable'),
  ('overwhelmed', 'Overwhelmed');

INSERT INTO user_profile (id, display_name, locale, created_at_utc, updated_at_utc)
VALUES (1, NULL, 'en', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'));
`,
};
