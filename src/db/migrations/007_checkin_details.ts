// Migration 007: extra check-in details from wireframes 04, 05 and 06
// (attendees, impact slider, note title). Keep docs/erd.md in sync with this file.
export const migration007 = {
  version: 7,
  sql: `
ALTER TABLE check_in ADD COLUMN group_size     TEXT    CHECK (group_size IN ('lt5', 'lt10', 'lt15', 'more'));
ALTER TABLE check_in ADD COLUMN one_on_one     INTEGER CHECK (one_on_one IN (0, 1));
ALTER TABLE check_in ADD COLUMN stranger_count INTEGER CHECK (stranger_count >= 0);
ALTER TABLE check_in ADD COLUMN friends_made   INTEGER CHECK (friends_made >= 0);
ALTER TABLE check_in ADD COLUMN energy_change  INTEGER CHECK (energy_change BETWEEN -100 AND 100);
ALTER TABLE check_in ADD COLUMN note_title     TEXT;
`,
};
