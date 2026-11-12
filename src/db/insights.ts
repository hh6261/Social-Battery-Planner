import { listCheckInsInRange } from './checkIns';
import type { CheckIn } from './types';

// Insights are DERIVED from check_in (+ moods), so no extra tables are needed and the
// ERD does not change. Screens call the get* functions and feed the results to charts.

export type DailyPoint = { date: string; avgBattery: number; count: number }; // date = local YYYY-MM-DD
export type MoodCount = { mood: string; count: number };
export type ImpactItem = { name: string; avgImpact: number; avgBattery: number; count: number };
export type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'night';
export type TimeOfDayPoint = { bucket: TimeBucket; avgBattery: number; count: number };
export type Summary = {
  count: number;
  avgBattery: number | null;
  lowest: number | null;
  highest: number | null;
  avgImpact: number | null;
};

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

function localDateKey(utcIso: string): string {
  const d = new Date(utcIso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function bucketOf(utcIso: string): TimeBucket {
  const h = new Date(utcIso).getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

// ---------- pure functions (easy to test, no DB) ----------

export function summarize(items: CheckIn[]): Summary {
  const levels = items.map((c) => c.batteryLevel);
  const ratings = items.map((c) => c.impactRating).filter((r): r is number => r !== null);
  return {
    count: items.length,
    avgBattery: items.length ? round1(avg(levels)) : null,
    lowest: items.length ? Math.min(...levels) : null,
    highest: items.length ? Math.max(...levels) : null,
    avgImpact: ratings.length ? round1(avg(ratings)) : null,
  };
}

export function dailyTrend(items: CheckIn[]): DailyPoint[] {
  const byDay = new Map<string, number[]>();
  for (const c of items) {
    const k = localDateKey(c.createdAtUtc);
    byDay.set(k, [...(byDay.get(k) ?? []), c.batteryLevel]);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, avgBattery: round1(avg(v)), count: v.length }));
}

export function moodFrequency(items: CheckIn[]): MoodCount[] {
  const counts = new Map<string, number>();
  for (const c of items) for (const m of c.moods) counts.set(m, (counts.get(m) ?? 0) + 1);
  return [...counts.entries()].map(([mood, count]) => ({ mood, count })).sort((a, b) => b.count - a.count);
}

function impactBy(items: CheckIn[], keysOf: (c: CheckIn) => string[]): ImpactItem[] {
  const groups = new Map<string, { impact: number[]; battery: number[] }>();
  for (const c of items) {
    if (c.impactRating === null) continue;
    for (const key of keysOf(c)) {
      const g = groups.get(key) ?? { impact: [], battery: [] };
      g.impact.push(c.impactRating);
      g.battery.push(c.batteryLevel);
      groups.set(key, g);
    }
  }
  return [...groups.entries()]
    .map(([name, g]) => ({
      name,
      avgImpact: round1(avg(g.impact)),
      avgBattery: round1(avg(g.battery)),
      count: g.impact.length,
    }))
    .sort((a, b) => b.avgImpact - a.avgImpact);
}

/** Activities ranked from most recharging to most draining (only rated check-ins). */
export function activityImpact(items: CheckIn[]): ImpactItem[] {
  return impactBy(items, (c) => (c.activity?.trim() ? [c.activity.trim()] : []));
}

/** People ranked from most recharging to most draining. `attendees` is comma-separated text. */
export function attendeeImpact(items: CheckIn[]): ImpactItem[] {
  return impactBy(items, (c) =>
    (c.attendees ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

export function timeOfDayAverage(items: CheckIn[]): TimeOfDayPoint[] {
  const order: TimeBucket[] = ['morning', 'afternoon', 'evening', 'night'];
  const groups = new Map<TimeBucket, number[]>();
  for (const c of items) {
    const b = bucketOf(c.createdAtUtc);
    groups.set(b, [...(groups.get(b) ?? []), c.batteryLevel]);
  }
  return order
    .filter((b) => groups.has(b))
    .map((bucket) => ({ bucket, avgBattery: round1(avg(groups.get(bucket)!)), count: groups.get(bucket)!.length }));
}

// ---------- DB-backed entry points for screens ----------

export type InsightsData = {
  summary: Summary;
  trend: DailyPoint[];
  moods: MoodCount[];
  activities: ImpactItem[];
  people: ImpactItem[];
  timeOfDay: TimeOfDayPoint[];
};

/** Everything the insights screen needs for the last `days` days (default 30), in one call. */
export async function getInsights(days = 30): Promise<InsightsData> {
  const end = new Date();
  end.setDate(end.getDate() + 1);
  end.setHours(0, 0, 0, 0); // end of today (local)
  const start = new Date(end);
  start.setDate(start.getDate() - days);

  const items = await listCheckInsInRange(start, end);
  return {
    summary: summarize(items),
    trend: dailyTrend(items),
    moods: moodFrequency(items),
    activities: activityImpact(items),
    people: attendeeImpact(items),
    timeOfDay: timeOfDayAverage(items),
  };
}
