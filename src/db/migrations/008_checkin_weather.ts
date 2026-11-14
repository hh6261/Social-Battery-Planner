// Migration 008: the weather at the moment of a check-in (recorded automatically from Open-Meteo).
// Stored as the raw WMO code + temperature, so the text can be shown in any language.
// Keep docs/erd.md in sync with this file.
export const migration008 = {
  version: 8,
  sql: `
ALTER TABLE check_in ADD COLUMN weather_code INTEGER CHECK (weather_code BETWEEN 0 AND 99);
ALTER TABLE check_in ADD COLUMN weather_temp REAL;
ALTER TABLE check_in ADD COLUMN weather_city TEXT;
`,
};
