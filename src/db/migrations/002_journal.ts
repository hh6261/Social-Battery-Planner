// Migration 002: journal. Keep docs/erd.md in sync with this file.
export const migration002 = {
  version: 2,
  sql: `
CREATE TABLE journal_entry (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT,
  body            TEXT NOT NULL,
  check_in_id     INTEGER REFERENCES check_in(id) ON DELETE SET NULL,  -- optional link
  created_at_utc  TEXT NOT NULL,
  updated_at_utc  TEXT NOT NULL
);
CREATE INDEX idx_journal_created ON journal_entry(created_at_utc);
CREATE INDEX idx_journal_check_in ON journal_entry(check_in_id);
`,
};
