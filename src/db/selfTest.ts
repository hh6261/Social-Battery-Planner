import { createCheckIn, deleteCheckIn, getCheckIn } from './checkIns';
import { createJournalEntry, deleteJournalEntry, getJournalEntry } from './journal';

export type SelfTestResult = { name: string; ok: boolean; detail?: string };

const SAMPLES = {
  croatian: 'č ć đ š ž Č Ć Đ Š Ž – Šime čeka đaka u Čakovcu, žuti ćevapi.',
  japanese: '日本語のテスト：友達とカフェ、ありがとう',
  arabic: 'اختبار اللغة العربية: قهوة مع ليلى',
};

/**
 * Saves check-ins and journal entries containing Croatian diacritics, Japanese and Arabic,
 * reloads them, compares, then deletes them. Run from the dev screen; also used for the Part B evidence.
 * Does NOT cover the "close Expo Go and reopen" persistence test, which must be done by hand (F2).
 */
export async function runUnicodeRoundTripTest(): Promise<SelfTestResult[]> {
  const results: SelfTestResult[] = [];
  for (const [label, text] of Object.entries(SAMPLES)) {
    let checkInId: number | null = null;
    try {
      const created = await createCheckIn({
        batteryLevel: 50,
        activity: text,
        attendees: text,
        notes: text,
        moods: ['calm'],
      });
      checkInId = created.id;
      const loaded = await getCheckIn(checkInId);
      const ok = loaded?.activity === text && loaded?.attendees === text && loaded?.notes === text;
      results.push({ name: `check_in unicode: ${label}`, ok, detail: ok ? undefined : `got ${loaded?.notes}` });
    } catch (e) {
      results.push({ name: `check_in unicode: ${label}`, ok: false, detail: String(e) });
    } finally {
      if (checkInId !== null) await deleteCheckIn(checkInId);
    }

    let journalId: number | null = null;
    try {
      const created = await createJournalEntry({ title: text, body: text });
      journalId = created.id;
      const loaded = await getJournalEntry(journalId);
      const ok = loaded?.title === text && loaded?.body === text;
      results.push({ name: `journal unicode: ${label}`, ok, detail: ok ? undefined : `got ${loaded?.body}` });
    } catch (e) {
      results.push({ name: `journal unicode: ${label}`, ok: false, detail: String(e) });
    } finally {
      if (journalId !== null) await deleteJournalEntry(journalId);
    }
  }
  return results;
}
