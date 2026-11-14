import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from './client';
import { localDayRangeUtc, nowUtc } from './time';
import type { CheckIn, CheckInPatch, GroupSize, NewCheckIn } from './types';

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
  group_size: GroupSize | null;
  one_on_one: number | null; // 0 or 1
  stranger_count: number | null;
  friends_made: number | null;
  energy_change: number | null;
  note_title: string | null;
  weather_code: number | null;
  weather_temp: number | null;
  weather_city: string | null;
  mood_keys: string | null;
};

const SELECT_CHECK_IN = `
  SELECT c.*, group_concat(m.key) AS mood_keys
  FROM check_in c
  LEFT JOIN check_in_mood cm ON cm.check_in_id = c.id
  LEFT JOIN mood m ON m.id = cm.mood_id
`;

const GROUP_SIZES: GroupSize[] = ['lt5', 'lt10', 'lt15', 'more'];

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
    groupSize: r.group_size,
    oneOnOne: r.one_on_one === null ? null : r.one_on_one === 1,
    strangerCount: r.stranger_count,
    friendsMade: r.friends_made,
    energyChange: r.energy_change,
    noteTitle: r.note_title,
    weatherCode: r.weather_code,
    weatherTemp: r.weather_temp,
    weatherCity: r.weather_city,
  };
}

/**
 * The impact screen stores -100 (drained me) to 100 (recharged me). The insights still use a
 * 1 to 5 scale, so it is derived here: -100 -> 1, -50 -> 2, 0 -> 3, 50 -> 4, 100 -> 5.
 */
export function impactFromEnergyChange(change: number): number {
  return Math.min(5, Math.max(1, Math.round(change / 50) + 3));
}

function isCount(n: number | null | undefined): boolean {
  return n === undefined || n === null || (Number.isInteger(n) && n >= 0);
}

function validate(input: {
  batteryLevel?: number;
  impactRating?: number | null;
  energyChange?: number | null;
  strangerCount?: number | null;
  friendsMade?: number | null;
  groupSize?: GroupSize | null;
  weatherCode?: number | null;
}) {
  const { batteryLevel: level, impactRating: rating, energyChange: change } = input;
  if (level !== undefined && (!Number.isInteger(level) || level < 0 || level > 100)) {
    throw new Error('batteryLevel must be an integer from 0 to 100');
  }
  if (rating !== undefined && rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    throw new Error('impactRating must be an integer from 1 to 5');
  }
  if (change !== undefined && change !== null && (!Number.isInteger(change) || change < -100 || change > 100)) {
    throw new Error('energyChange must be an integer from -100 to 100');
  }
  if (input.weatherCode !== undefined && input.weatherCode !== null && (!Number.isInteger(input.weatherCode) || input.weatherCode < 0 || input.weatherCode > 99)) {
    throw new Error('weatherCode must be a WMO code from 0 to 99');
  }
  if (!isCount(input.strangerCount)) throw new Error('strangerCount must be a whole number, 0 or more');
  if (!isCount(input.friendsMade)) throw new Error('friendsMade must be a whole number, 0 or more');
  if (input.groupSize !== undefined && input.groupSize !== null && !GROUP_SIZES.includes(input.groupSize)) {
    throw new Error('groupSize must be lt5, lt10, lt15 or more');
  }
}

const boolToInt = (b: boolean | null | undefined): number | null =>
  b === null || b === undefined ? null : b ? 1 : 0;

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
  validate(input);
  const db = await getDb();
  const ts = input.createdAtUtc ?? nowUtc();
  const impact =
    input.energyChange !== undefined && input.energyChange !== null
      ? impactFromEnergyChange(input.energyChange)
      : (input.impactRating ?? null);
  let id = 0;

  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      `INSERT INTO check_in
         (battery_level, activity, attendees, impact_rating, notes, event_id, created_at_utc, updated_at_utc,
          group_size, one_on_one, stranger_count, friends_made, energy_change, note_title,
          weather_code, weather_temp, weather_city)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.batteryLevel,
        input.activity ?? null,
        input.attendees ?? null,
        impact,
        input.notes ?? null,
        input.eventId ?? null,
        ts,
        ts,
        input.groupSize ?? null,
        boolToInt(input.oneOnOne),
        input.strangerCount ?? null,
        input.friendsMade ?? null,
        input.energyChange ?? null,
        input.noteTitle ?? null,
        input.weatherCode ?? null,
        input.weatherTemp ?? null,
        input.weatherCity ?? null,
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
  validate(patch);
  const existing = await getCheckIn(id);
  if (!existing) return null;
  const db = await getDb();

  const energyChange = patch.energyChange !== undefined ? patch.energyChange : existing.energyChange;
  let impact = existing.impactRating;
  if (patch.energyChange !== undefined) {
    impact = patch.energyChange === null ? null : impactFromEnergyChange(patch.energyChange);
  } else if (patch.impactRating !== undefined) {
    impact = patch.impactRating;
  }

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE check_in SET
         battery_level = ?, activity = ?, attendees = ?, impact_rating = ?,
         notes = ?, event_id = ?, updated_at_utc = ?,
         group_size = ?, one_on_one = ?, stranger_count = ?, friends_made = ?,
         energy_change = ?, note_title = ?,
         weather_code = ?, weather_temp = ?, weather_city = ?
       WHERE id = ?`,
      [
        patch.batteryLevel ?? existing.batteryLevel,
        patch.activity !== undefined ? patch.activity : existing.activity,
        patch.attendees !== undefined ? patch.attendees : existing.attendees,
        impact,
        patch.notes !== undefined ? patch.notes : existing.notes,
        patch.eventId !== undefined ? patch.eventId : existing.eventId,
        nowUtc(),
        patch.groupSize !== undefined ? patch.groupSize : existing.groupSize,
        boolToInt(patch.oneOnOne !== undefined ? patch.oneOnOne : existing.oneOnOne),
        patch.strangerCount !== undefined ? patch.strangerCount : existing.strangerCount,
        patch.friendsMade !== undefined ? patch.friendsMade : existing.friendsMade,
        energyChange,
        patch.noteTitle !== undefined ? patch.noteTitle : existing.noteTitle,
        patch.weatherCode !== undefined ? patch.weatherCode : existing.weatherCode,
        patch.weatherTemp !== undefined ? patch.weatherTemp : existing.weatherTemp,
        patch.weatherCity !== undefined ? patch.weatherCity : existing.weatherCity,
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

/** Newest first. Check-ins created before `beforeUtc` (for the "Previous check-ins" list). */
export async function listCheckInsBefore(beforeUtc: string, limit = 30): Promise<CheckIn[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CheckInRow>(
    `${SELECT_CHECK_IN}
     WHERE c.created_at_utc < ?
     GROUP BY c.id
     ORDER BY c.created_at_utc DESC
     LIMIT ?`,
    [beforeUtc, limit]
  );
  return rows.map(toCheckIn);
}

/** Activities the user typed in earlier check-ins, most recent first, without duplicates. */
export async function listPreviousActivities(limit = 8): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ activity: string }>(
    `SELECT activity FROM check_in
     WHERE activity IS NOT NULL AND length(trim(activity)) > 0
     GROUP BY lower(activity)
     ORDER BY max(created_at_utc) DESC
     LIMIT ?`,
    [limit]
  );
  return rows.map((r) => r.activity);
}
