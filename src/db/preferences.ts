import type { EnergyLevel, Situation, SituationKind, UserPreferences } from '../services/types';
import { getDb } from './client';
import { nowUtc } from './time';

// Stressors ("drain") and relaxers ("recharge") chosen in personalization and
// edited on the Profile screen.

type Row = {
  id: number;
  kind: SituationKind;
  label: string;
  level: EnergyLevel;
  is_custom: number;
  created_at_utc: string;
};

const toSituation = (r: Row): Situation => ({
  id: String(r.id),
  kind: r.kind,
  label: r.label,
  level: r.level,
  custom: r.is_custom === 1,
});

export async function getPreferences(): Promise<UserPreferences> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>('SELECT * FROM situation ORDER BY id');
  return {
    drains: rows.filter((r) => r.kind === 'drain').map(toSituation),
    recharges: rows.filter((r) => r.kind === 'recharge').map(toSituation),
  };
}

/**
 * Replaces the whole list in one transaction (what the screens edit is the
 * full list). Duplicate labels within a kind are skipped (case-insensitive).
 * Order and creation dates are kept for items that were already saved.
 */
export async function savePreferences(prefs: UserPreferences): Promise<void> {
  const db = await getDb();
  const existing = await db.getAllAsync<Row>('SELECT * FROM situation');
  const createdAt = new Map(existing.map((r) => [`${r.kind}:${r.label.toLowerCase()}`, r.created_at_utc]));
  const ts = nowUtc();

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM situation');
    for (const s of [...prefs.drains, ...prefs.recharges]) {
      const label = s.label.trim();
      if (!label) continue;
      await db.runAsync(
        'INSERT OR IGNORE INTO situation (kind, label, level, is_custom, created_at_utc) VALUES (?, ?, ?, ?, ?)',
        [s.kind, label, s.level, s.custom ? 1 : 0, createdAt.get(`${s.kind}:${label.toLowerCase()}`) ?? ts],
      );
    }
  });
}
