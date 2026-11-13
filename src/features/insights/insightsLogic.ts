import type { CheckIn } from '@/db/types';

import { addDays, localDayKey, startOfDay } from '@/features/planner/dates';

// Pure calculations for the Daily Timeline (screen 20) and Weekly Overview (screen 21).
// No database and no React, so they are easy to test.

/** The day chart runs from 06:00 to midnight, as in wireframe 01. */
export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 24;

/** The week needs check-ins on at least this many days before it shows highs, lows and a trend. */
export const MIN_DAYS_FOR_WEEK = 3;

/** A change of fewer than this many percentage points between weeks counts as "about the same". */
export const STEADY_RANGE = 5;

export type Band = 'high' | 'medium' | 'low';

export function bandOf(level: number): Band {
  if (level >= 67) return 'high';
  if (level >= 34) return 'medium';
  return 'low';
}

/** Horizontal position on the day chart, 0 (06:00) to 1 (24:00). Earlier times stick to the left edge. */
export function chartX(date: Date): number {
  const hours = date.getHours() + date.getMinutes() / 60;
  const x = (hours - DAY_START_HOUR) / (DAY_END_HOUR - DAY_START_HOUR);
  return Math.min(1, Math.max(0, x));
}

/** Monday of the week that contains `date` (weeks start on Monday, as in the wireframe: M to S). */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const mondayOffset = (d.getDay() + 6) % 7; // Sunday (0) -> 6, Monday (1) -> 0
  return addDays(d, -mondayOffset);
}

export type DayStats = {
  date: Date;
  count: number;
  min: number | null;
  max: number | null;
  avg: number | null;
};

const average = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Seven entries, Monday to Sunday, with the battery range and average of each day. */
export function weekStats(items: CheckIn[], weekStart: Date): DayStats[] {
  const byDay = new Map<string, number[]>();
  for (const c of items) {
    const key = localDayKey(new Date(c.createdAtUtc));
    byDay.set(key, [...(byDay.get(key) ?? []), c.batteryLevel]);
  }
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const levels = byDay.get(localDayKey(date)) ?? [];
    return {
      date,
      count: levels.length,
      min: levels.length ? Math.min(...levels) : null,
      max: levels.length ? Math.max(...levels) : null,
      avg: levels.length ? Math.round(average(levels)) : null,
    };
  });
}

export type WeekSummary =
  | { kind: 'lowData'; daysMissing: number }
  | {
      kind: 'ready';
      trend: 'improved' | 'dropped' | 'steady' | null; // null = not enough data last week
      lowest: DayStats;
      highest: DayStats;
    };

/**
 * Answers the open question from wireframe 02 ("how does the app decide that it improved?"):
 * it compares this week's average battery with last week's. Only days with check-ins count.
 */
export function summarizeWeek(days: DayStats[], lastWeekItems: CheckIn[]): WeekSummary {
  const withData = days.filter((d) => d.avg !== null);
  if (withData.length < MIN_DAYS_FOR_WEEK) {
    return { kind: 'lowData', daysMissing: MIN_DAYS_FOR_WEEK - withData.length };
  }
  const lowest = withData.reduce((a, b) => (b.avg! < a.avg! ? b : a));
  const highest = withData.reduce((a, b) => (b.avg! > a.avg! ? b : a));

  let trend: 'improved' | 'dropped' | 'steady' | null = null;
  if (lastWeekItems.length > 0) {
    const thisAvg = average(withData.map((d) => d.avg!));
    const lastAvg = average(lastWeekItems.map((c) => c.batteryLevel));
    const diff = thisAvg - lastAvg;
    trend = Math.abs(diff) < STEADY_RANGE ? 'steady' : diff > 0 ? 'improved' : 'dropped';
  }
  return { kind: 'ready', trend, lowest, highest };
}
