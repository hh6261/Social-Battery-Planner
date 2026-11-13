import { getDb } from './client';
import { nowUtc } from './time';
import type { NewRechargeActivity, RechargeActivity } from './types';

// The user's list of things that recharge them (screen 25). Screens never contain SQL.

type Row = {
  id: number;
  key: string | null;
  name: string | null;
  minutes: 15 | 30 | 60;
  is_outdoor: number;
};

const toActivity = (r: Row): RechargeActivity => ({
  id: r.id,
  key: r.key,
  name: r.name,
  minutes: r.minutes,
  isOutdoor: r.is_outdoor === 1,
});

export async function listRechargeActivities(): Promise<RechargeActivity[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    'SELECT id, key, name, minutes, is_outdoor FROM recharge_activity ORDER BY minutes, id'
  );
  return rows.map(toActivity);
}

export async function addRechargeActivity(input: NewRechargeActivity): Promise<RechargeActivity> {
  const name = input.name.trim();
  if (name === '') throw new Error('name must not be empty');
  if (![15, 30, 60].includes(input.minutes)) throw new Error('minutes must be 15, 30 or 60');
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO recharge_activity (name, minutes, is_outdoor, created_at_utc) VALUES (?, ?, ?, ?)',
    [name, input.minutes, input.isOutdoor ? 1 : 0, nowUtc()]
  );
  const row = await db.getFirstAsync<Row>(
    'SELECT id, key, name, minutes, is_outdoor FROM recharge_activity WHERE id = ?',
    [res.lastInsertRowId]
  );
  if (!row) throw new Error('Activity was not saved');
  return toActivity(row);
}

/** Returns true if a row was deleted. */
export async function deleteRechargeActivity(id: number): Promise<boolean> {
  const db = await getDb();
  const res = await db.runAsync('DELETE FROM recharge_activity WHERE id = ?', [id]);
  return res.changes > 0;
}
