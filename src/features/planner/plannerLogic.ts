import type { TFunction } from 'i18next';

import type { PlannedEvent } from '@/db/types';
import { formatNumber } from '@/i18n/format';
import type { DailyForecast } from '@/services/weatherService';
import { weatherCodeToCondition } from '@/services/weatherCodes';

import { localDayKey } from './dates';

// Pure functions for the planner (no database, no React), so they are easy to test.

/** A day with this much expected drain or more gets the "Take 30 minutes alone?" suggestion. */
export const HEAVY_DAY_DRAIN = 60;
export const RECHARGE_MINUTES = 30;
/** The event type used for quiet time alone (seeded as "Solo walk"). */
export const RECHARGE_TYPE_KEY = 'walk';

export function endOf(e: PlannedEvent): Date {
  return e.endsAtUtc ? new Date(e.endsAtUtc) : new Date(e.startsAtUtc);
}

export function durationMinutes(e: PlannedEvent): number | null {
  if (!e.endsAtUtc) return null;
  return Math.round((Date.parse(e.endsAtUtc) - Date.parse(e.startsAtUtc)) / 60_000);
}

/** Events grouped by their local calendar day, in the order they come in (already sorted by start). */
export function groupByDay(events: PlannedEvent[]): [string, PlannedEvent[]][] {
  const groups = new Map<string, PlannedEvent[]>();
  for (const e of events) {
    const key = localDayKey(new Date(e.startsAtUtc));
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  return [...groups.entries()];
}

export function dayDrain(events: PlannedEvent[]): number {
  return events.reduce((sum, e) => sum + (e.expectedDrain ?? 0), 0);
}

/** Offer quiet time when the day is heavy and has no quiet time yet. */
export function needsRecharge(events: PlannedEvent[]): boolean {
  return (
    dayDrain(events) >= HEAVY_DAY_DRAIN && !events.some((e) => e.typeKey === RECHARGE_TYPE_KEY)
  );
}

/**
 * Where the quiet time goes: right after the last event if it still fits before midnight,
 * otherwise just before the first event, so it always lands on the day it was offered for.
 */
export function rechargeStart(events: PlannedEvent[]): Date {
  const first = new Date(Math.min(...events.map((e) => Date.parse(e.startsAtUtc))));
  const afterLast = new Date(Math.max(...events.map((e) => endOf(e).getTime())));
  const midnight = new Date(first.getFullYear(), first.getMonth(), first.getDate() + 1);
  if (afterLast.getTime() + RECHARGE_MINUTES * 60_000 <= midnight.getTime()) return afterLast;
  return new Date(first.getTime() - RECHARGE_MINUTES * 60_000);
}

/** True when an outdoor plan is likely to get wet: rain, showers, drizzle, storm, snow or 50 %+ chance. */
export function isWetDay(day: DailyForecast): boolean {
  const c = weatherCodeToCondition(day.weatherCode);
  if (c === 'rain' || c === 'showers' || c === 'drizzle' || c === 'thunderstorm' || c === 'snow') {
    return true;
  }
  return (day.rainChance ?? 0) >= 50;
}

/** "45 min", "1 h", "1 h 30 min" in the current language. */
export function formatDuration(t: TFunction, totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return t('planner.duration.minutes', { minutes: formatNumber(minutes) });
  if (minutes === 0) return t('planner.duration.hours', { hours: formatNumber(hours) });
  return t('planner.duration.hoursMinutes', {
    hours: formatNumber(hours),
    minutes: formatNumber(minutes),
  });
}
