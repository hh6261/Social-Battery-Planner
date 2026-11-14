import { getDb } from './client';
import { localDayRangeUtc } from './time';

// Read-only queries for the Home screen and the daily reminder pop-up.

export type DayEvent = {
  id: number;
  title: string;
  startsAtUtc: string;
  /** 0–100. The event's own estimate, or its event type's default. */
  drain: number;
};

/** Events that start on the local calendar day of `date`, earliest first. */
export async function listEventsForDay(date: Date): Promise<DayEvent[]> {
  const db = await getDb();
  const { startUtc, endUtc } = localDayRangeUtc(date);
  const rows = await db.getAllAsync<{ id: number; title: string; starts_at_utc: string; drain: number }>(
    `SELECT e.id, e.title, e.starts_at_utc, COALESCE(e.expected_drain, t.default_drain) AS drain
       FROM event e
       JOIN event_type t ON t.id = e.event_type_id
      WHERE e.starts_at_utc >= ? AND e.starts_at_utc < ?
      ORDER BY e.starts_at_utc`,
    [startUtc, endUtc],
  );
  return rows.map((r) => ({ id: r.id, title: r.title, startsAtUtc: r.starts_at_utc, drain: r.drain }));
}

/** Battery level from the most recent check-in, or null if there are none yet. */
export async function getLatestBatteryLevel(): Promise<number | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ battery_level: number }>(
    'SELECT battery_level FROM check_in ORDER BY created_at_utc DESC LIMIT 1',
  );
  return row?.battery_level ?? null;
}