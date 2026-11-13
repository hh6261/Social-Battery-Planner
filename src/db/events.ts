import { getDb } from './client';
import type { EventPatch, EventType, NewEvent, PlannedEvent } from './types';

// Events for the planner (screens 18 Plan Ahead and 19 Add/Edit Event).
// Screens call these functions and never contain SQL.

type EventRow = {
  id: number;
  event_type_id: number;
  type_key: string;
  title: string;
  location: string | null;
  starts_at_utc: string;
  ends_at_utc: string | null;
  expected_drain: number | null;
  is_outdoor: number;
};

const SELECT_EVENT = `
  SELECT e.id, e.event_type_id, t.key AS type_key, e.title, e.location,
         e.starts_at_utc, e.ends_at_utc, e.expected_drain, e.is_outdoor
  FROM event e
  JOIN event_type t ON t.id = e.event_type_id
`;

function toEvent(r: EventRow): PlannedEvent {
  return {
    id: r.id,
    eventTypeId: r.event_type_id,
    typeKey: r.type_key,
    title: r.title,
    location: r.location,
    startsAtUtc: r.starts_at_utc,
    endsAtUtc: r.ends_at_utc,
    expectedDrain: r.expected_drain,
    isOutdoor: r.is_outdoor === 1,
  };
}

function validate(e: EventPatch) {
  if (e.title !== undefined && e.title.trim() === '') {
    throw new Error('title must not be empty');
  }
  if (e.expectedDrain !== undefined && e.expectedDrain !== null) {
    if (!Number.isInteger(e.expectedDrain) || e.expectedDrain < 0 || e.expectedDrain > 100) {
      throw new Error('expectedDrain must be an integer from 0 to 100');
    }
  }
  if (e.startsAtUtc && e.endsAtUtc && e.endsAtUtc <= e.startsAtUtc) {
    throw new Error('endsAtUtc must be after startsAtUtc');
  }
}

export async function listEventTypes(): Promise<EventType[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    key: string;
    name: string;
    emoji: string | null;
    default_drain: number;
  }>('SELECT id, key, name, emoji, default_drain FROM event_type ORDER BY id');
  return rows.map((r) => ({
    id: r.id,
    key: r.key,
    name: r.name,
    emoji: r.emoji,
    defaultDrain: r.default_drain,
  }));
}

export async function getEvent(id: number): Promise<PlannedEvent | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<EventRow>(`${SELECT_EVENT} WHERE e.id = ?`, [id]);
  return row ? toEvent(row) : null;
}

/** Events that start between two moments (start inclusive, end exclusive), soonest first. */
export async function listEventsInRange(start: Date, end: Date): Promise<PlannedEvent[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<EventRow>(
    `${SELECT_EVENT}
     WHERE e.starts_at_utc >= ? AND e.starts_at_utc < ?
     ORDER BY e.starts_at_utc ASC`,
    [start.toISOString(), end.toISOString()]
  );
  return rows.map(toEvent);
}

export async function createEvent(input: NewEvent): Promise<PlannedEvent> {
  validate(input);
  const db = await getDb();

  let drain = input.expectedDrain;
  if (drain === undefined) {
    const type = await db.getFirstAsync<{ default_drain: number }>(
      'SELECT default_drain FROM event_type WHERE id = ?',
      [input.eventTypeId]
    );
    drain = type?.default_drain ?? null;
  }

  const res = await db.runAsync(
    `INSERT INTO event
       (event_type_id, title, location, starts_at_utc, ends_at_utc, expected_drain, is_outdoor)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.eventTypeId,
      input.title.trim(),
      input.location?.trim() || null,
      input.startsAtUtc,
      input.endsAtUtc ?? null,
      drain,
      input.isOutdoor ? 1 : 0,
    ]
  );

  const created = await getEvent(res.lastInsertRowId);
  if (!created) throw new Error('Event was not saved');
  return created;
}

export async function updateEvent(id: number, patch: EventPatch): Promise<PlannedEvent | null> {
  const existing = await getEvent(id);
  if (!existing) return null;
  const merged: NewEvent = {
    eventTypeId: patch.eventTypeId ?? existing.eventTypeId,
    title: patch.title ?? existing.title,
    location: patch.location !== undefined ? patch.location : existing.location,
    startsAtUtc: patch.startsAtUtc ?? existing.startsAtUtc,
    endsAtUtc: patch.endsAtUtc !== undefined ? patch.endsAtUtc : existing.endsAtUtc,
    expectedDrain: patch.expectedDrain !== undefined ? patch.expectedDrain : existing.expectedDrain,
    isOutdoor: patch.isOutdoor ?? existing.isOutdoor,
  };
  validate(merged);

  const db = await getDb();
  await db.runAsync(
    `UPDATE event SET
       event_type_id = ?, title = ?, location = ?, starts_at_utc = ?,
       ends_at_utc = ?, expected_drain = ?, is_outdoor = ?
     WHERE id = ?`,
    [
      merged.eventTypeId,
      merged.title.trim(),
      merged.location?.trim() || null,
      merged.startsAtUtc,
      merged.endsAtUtc ?? null,
      merged.expectedDrain ?? null,
      merged.isOutdoor ? 1 : 0,
      id,
    ]
  );
  return getEvent(id);
}

/**
 * Returns true if a row was deleted. Reflections are removed by ON DELETE CASCADE;
 * check-ins linked to the event keep existing (event_id becomes NULL).
 */
export async function deleteEvent(id: number): Promise<boolean> {
  const db = await getDb();
  const res = await db.runAsync('DELETE FROM event WHERE id = ?', [id]);
  return res.changes > 0;
}
