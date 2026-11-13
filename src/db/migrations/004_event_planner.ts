// Migration 004: what the planner (screens 18 and 19) needs. Keep docs/erd.md in sync with this file.
// - event.is_outdoor: outdoor events get the weather forecast and a rain warning (F4).
// - event_type.key: a stable identifier, so the type name can be translated
//   (eventType.<key> in the locale files) instead of showing the English name stored in `name`.
export const migration004 = {
  version: 4,
  sql: `
ALTER TABLE event ADD COLUMN is_outdoor INTEGER NOT NULL DEFAULT 0 CHECK (is_outdoor IN (0, 1));

ALTER TABLE event_type ADD COLUMN key TEXT;
UPDATE event_type SET key = CASE name
  WHEN 'Family gathering'     THEN 'family'
  WHEN 'Coffee with a friend' THEN 'coffee'
  WHEN 'Work meeting'         THEN 'work'
  WHEN 'Party'                THEN 'party'
  WHEN 'Solo walk'            THEN 'walk'
  ELSE lower(replace(name, ' ', '_'))
END;
CREATE UNIQUE INDEX idx_event_type_key ON event_type(key);

-- The seeded solo walk happens outside.
UPDATE event SET is_outdoor = 1
WHERE event_type_id IN (SELECT id FROM event_type WHERE key = 'walk');
`,
};
