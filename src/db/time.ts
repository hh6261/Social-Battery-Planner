// All timestamps are stored as UTC ISO-8601 strings (e.g. 2026-11-12T09:30:00.000Z)
// and only converted to local time for display.

export function nowUtc(): string {
  return new Date().toISOString();
}

/** UTC range [startUtc, endUtc) covering the *local* calendar day of `date`. */
export function localDayRangeUtc(date: Date): { startUtc: string; endUtc: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);
  return { startUtc: start.toISOString(), endUtc: end.toISOString() };
}

/** Convert a stored UTC string to a localized display string. */
export function formatLocal(
  utcIso: string,
  locale: string = 'en',
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }
): string {
  return new Date(utcIso).toLocaleString(locale, options);
}
