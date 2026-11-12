import { getDb } from './client';
import { localDayRangeUtc, nowUtc } from './time';
import type { JournalEntry, JournalPatch, NewJournalEntry } from './types';

type Row = {
  id: number;
  title: string | null;
  body: string;
  check_in_id: number | null;
  created_at_utc: string;
  updated_at_utc: string;
};

const toEntry = (r: Row): JournalEntry => ({
  id: r.id,
  title: r.title,
  body: r.body,
  checkInId: r.check_in_id,
  createdAtUtc: r.created_at_utc,
  updatedAtUtc: r.updated_at_utc,
});

export async function createJournalEntry(input: NewJournalEntry): Promise<JournalEntry> {
  if (!input.body.trim()) throw new Error('Journal entry body cannot be empty');
  const db = await getDb();
  const ts = input.createdAtUtc ?? nowUtc();
  const res = await db.runAsync(
    'INSERT INTO journal_entry (title, body, check_in_id, created_at_utc, updated_at_utc) VALUES (?,?,?,?,?)',
    [input.title ?? null, input.body, input.checkInId ?? null, ts, ts]
  );
  const created = await getJournalEntry(res.lastInsertRowId);
  if (!created) throw new Error('Journal entry was not saved');
  return created;
}

export async function getJournalEntry(id: number): Promise<JournalEntry | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>('SELECT * FROM journal_entry WHERE id = ?', [id]);
  return row ? toEntry(row) : null;
}

/** Entries for the local calendar day of `date`, oldest first (for the timeline). */
export async function listJournalByDay(date: Date): Promise<JournalEntry[]> {
  const db = await getDb();
  const { startUtc, endUtc } = localDayRangeUtc(date);
  const rows = await db.getAllAsync<Row>(
    'SELECT * FROM journal_entry WHERE created_at_utc >= ? AND created_at_utc < ? ORDER BY created_at_utc ASC',
    [startUtc, endUtc]
  );
  return rows.map(toEntry);
}

/** All entries, newest first, paged. */
export async function listJournalEntries(limit = 50, offset = 0): Promise<JournalEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    'SELECT * FROM journal_entry ORDER BY created_at_utc DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
  return rows.map(toEntry);
}

export async function updateJournalEntry(id: number, patch: JournalPatch): Promise<JournalEntry | null> {
  const existing = await getJournalEntry(id);
  if (!existing) return null;
  const body = patch.body ?? existing.body;
  if (!body.trim()) throw new Error('Journal entry body cannot be empty');
  const db = await getDb();
  await db.runAsync(
    'UPDATE journal_entry SET title = ?, body = ?, check_in_id = ?, updated_at_utc = ? WHERE id = ?',
    [
      patch.title !== undefined ? patch.title : existing.title,
      body,
      patch.checkInId !== undefined ? patch.checkInId : existing.checkInId,
      nowUtc(),
      id,
    ]
  );
  return getJournalEntry(id);
}

export async function deleteJournalEntry(id: number): Promise<boolean> {
  const db = await getDb();
  const res = await db.runAsync('DELETE FROM journal_entry WHERE id = ?', [id]);
  return res.changes > 0;
}
