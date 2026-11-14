export type DrainLevel = 'low' | 'moderate' | 'high';

/** Turns a 0–100 drain estimate into a word for display. */
export function drainLevel(drain: number): DrainLevel {
  if (drain <= 33) return 'low';
  if (drain <= 66) return 'moderate';
  return 'high';
}

export const DRAIN_LABELS: Record<DrainLevel, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
};

/** Estimated drain for a whole day: the events' drains added up, capped at 100%. */
export function totalDrain(events: { drain: number }[]): number {
  return Math.min(100, events.reduce((sum, e) => sum + e.drain, 0));
}

/** "10:00" style time in the user's locale. */
export function formatTime(utcIso: string, locale: string): string {
  return new Date(utcIso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}