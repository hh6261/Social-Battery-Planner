import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from './client';
import { localDayRangeUtc, nowUtc } from './time';
import type { CheckIn, CheckInPatch, NewCheckIn } from './types';

type CheckInRow = {
  id: number;
  battery_level: number;
  activity: string | null;
  attendees: string | null;
  impact_rating: number | null;
  notes: string | null;
  event_id: number | null;
  created_at_utc: string;
  updated_at_utc: string;
  mood_keys: string | null;
};

const SELECT_CHECK_IN = `
  SELECT c.*, group_concat(m.key) AS mood_keys
  FROM check_in c
  LEFT JOIN check_in_mood cm ON cm.check_in_id = c.id
  LEFT JOIN mood m ON m.id = cm.mood_id
`;

function toCheckIn(r: CheckInRow): CheckIn {
  return {
    id: r.id,
    batteryLevel: r.battery_level,
    activity: r.activity,
    attendees: r.attendees,
    impactRating: r.impact_rating,
    notes: r.notes,
    eventId: r.event_id,
    createdAtUtc: r.created_at_utc,
    updatedAtUtc: r.updated_at_utc,
    moods: r.mood_keys ? r.mood_keys.split(',') : [],
  };
}

function validate(level: number | undefined, rating: number | null | undefined) {
  if (level !== undefined && (!Number.isInteger(level) || level < 0 || level > 100)) {
    throw new Error('batteryLevel must be an integer from 0 to 100');
  }
  if (rating !== undefined && rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    throw new Error('impactRating must be an integer from 1 to 5');
  }
}

async function setMoods(db: SQLiteDatabase, checkInId: number, moodKeys: string[]) {
  await db.runAsync('DELETE FROM check_in_mood WHERE check_in_id = ?', [checkInId]);
  for (const key of new Set(moodKeys)) {
    await db.runAsync(
      'INSERT OR IGNORE INTO check_in_mood (check_in_id, mood_id) SELECT ?, id FROM mood WHERE key = ?',
      [checkInId, key]
    );
  }
}

export async function createCheckIn(input: NewCheckIn): Promise<CheckIn> {
  validate(input.batteryLevel, input.impactRating);
  const db = await getDb();
  const ts = input.createdAtUtc ?? nowUtc();
  let id = 0;

  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      `INSERT INTO check_in
         (battery_level, activity, attendees, impact_rating, notes, event_id, created_at_utc, updated_at_utc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.batteryLevel,
        input.activity ?? null,
        input.attendees ?? null,
        input.impactRating ?? null,
        input.notes ?? null,
        input.eventId ?? null,
        ts,
        ts,
      ]
    );
    id = res.lastInsertRowId;
    await setMoods(db, id, input.moods ?? []);
  });

  const created = await getCheckIn(id);
  if (!created) throw new Error('Check-in was not saved');
  return created;
}

export async function getCheckIn(id: number): Promise<CheckIn | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CheckInRow>(`${SELECT_CHECK_IN} WHERE c.id = ? GROUP BY c.id`, [id]);
  return row ? toCheckIn(row) : null;
}

/** Check-ins for the local calendar day of `date`, oldest first. */
export async function listCheckInsByDay(date: Date): Promise<CheckIn[]> {
  const db = await getDb();
  const { startUtc, endUtc } = localDayRangeUtc(date);
  const rows = await db.getAllAsync<CheckInRow>(
    `${SELECT_CHECK_IN}
     WHERE c.created_at_utc >= ? AND c.created_at_utc < ?
     GROUP BY c.id
     ORDER BY c.created_at_utc ASC`,
    [startUtc, endUtc]
  );
  return rows.map(toCheckIn);
}

export async function updateCheckIn(id: number, patch: CheckInPatch): Promise<CheckIn | null> {
  validate(patch.batteryLevel, patch.impactRating);
  const existing = await getCheckIn(id);
  if (!existing) return null;
  const db = await getDb();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE check_in SET
         battery_level = ?, activity = ?, attendees = ?, impact_rating = ?,
         notes = ?, event_id = ?, updated_at_utc = ?
       WHERE id = ?`,
      [
        patch.batteryLevel ?? existing.batteryLevel,
        patch.activity !== undefined ? patch.activity : existing.activity,
        patch.attendees !== undefined ? patch.attendees : existing.attendees,
        patch.impactRating !== undefined ? patch.impactRating : existing.impactRating,
        patch.notes !== undefined ? patch.notes : existing.notes,
        patch.eventId !== undefined ? patch.eventId : existing.eventId,
        nowUtc(),
        id,
      ]
    );
    if (patch.moods) await setMoods(db, id, patch.moods);
  });

  return getCheckIn(id);
}

/** Returns true if a row was deleted. Linked moods are removed by ON DELETE CASCADE. */
export async function deleteCheckIn(id: number): Promise<boolean> {
  const db = await getDb();
  const res = await db.runAsync('DELETE FROM check_in WHERE id = ?', [id]);
  return res.changes > 0;
}

export async function listMoods(): Promise<{ key: string; label: string }[]> {
  const db = await getDb();
  return db.getAllAsync<{ key: string; label: string }>('SELECT key, label FROM mood ORDER BY id');
}

/** Check-ins between two moments (start inclusive, end exclusive), oldest first. Used by insights. */
export async function listCheckInsInRange(start: Date, end: Date): Promise<CheckIn[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CheckInRow>(
    `${SELECT_CHECK_IN}
     WHERE c.created_at_utc >= ? AND c.created_at_utc < ?
     GROUP BY c.id
     ORDER BY c.created_at_utc ASC`,
    [start.toISOString(), end.toISOString()]
  );
  return rows.map(toCheckIn);
}
