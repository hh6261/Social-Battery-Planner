// Migration 003: adds the emotions of the mood wheel (wireframe 02). 'happy' already exists.
export const migration003 = {
  version: 3,
  sql: `
INSERT OR IGNORE INTO mood (key, label) VALUES
  ('bad', 'Bad'),
  ('fearful', 'Fearful'),
  ('angry', 'Angry'),
  ('disgusted', 'Disgusted'),
  ('sad', 'Sad'),
  ('surprised', 'Surprised');
`,
};