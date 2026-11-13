// Migration 005: the user's own list of things that recharge them (screen 25, Recharge Suggestions).
// Keep docs/erd.md in sync with this file.
// Built-in ideas have a `key` and are translated in the app (recharge.defaults.<key>);
// activities the user adds have their own `name` instead.
export const migration005 = {
  version: 5,
  sql: `
CREATE TABLE recharge_activity (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  key             TEXT UNIQUE,
  name            TEXT,
  minutes         INTEGER NOT NULL CHECK (minutes IN (15, 30, 60)),
  is_outdoor      INTEGER NOT NULL DEFAULT 0 CHECK (is_outdoor IN (0, 1)),
  created_at_utc  TEXT NOT NULL,
  CHECK (key IS NOT NULL OR length(trim(name)) > 0)
);

INSERT INTO recharge_activity (key, name, minutes, is_outdoor, created_at_utc) VALUES
  ('alone',      NULL, 30, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('walk',       NULL, 30, 1, strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('callFriend', NULL, 15, 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'));
`,
};
