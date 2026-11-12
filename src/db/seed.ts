import type { SQLiteDatabase } from 'expo-sqlite';

const HOUR = 3600 * 1000;
const iso = (hoursAgo: number) => new Date(Date.now() - hoursAgo * HOUR).toISOString();

/**
 * Realistic sample data. All names are fictional; mix of cultures and scripts.
 * Only runs when the database has no event types yet, so it is safe to call on every start.
 */
export async function seedIfEmpty(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM event_type');
  if ((row?.n ?? 0) > 0) return;

  await db.withTransactionAsync(async () => {
    const types: [string, string, number][] = [
      ['Family gathering', '👨‍👩‍👧', 45],
      ['Coffee with a friend', '☕', 20],
      ['Work meeting', '💼', 35],
      ['Party', '🎉', 70],
      ['Solo walk', '🚶', -15],
    ];
    const typeId: Record<string, number> = {};
    for (const [name, emoji, drain] of types) {
      const r = await db.runAsync(
        'INSERT INTO event_type (name, emoji, default_drain) VALUES (?, ?, ?)',
        [name, emoji, Math.max(0, drain)]
      );
      typeId[name] = r.lastInsertRowId;
    }

    const e1 = await db.runAsync(
      'INSERT INTO event (event_type_id, title, location, starts_at_utc, ends_at_utc, expected_drain) VALUES (?,?,?,?,?,?)',
      [typeId['Coffee with a friend'], 'Kava s Đurđom', 'Zagreb', iso(26), iso(25), 20]
    );
    const e2 = await db.runAsync(
      'INSERT INTO event (event_type_id, title, location, starts_at_utc, ends_at_utc, expected_drain) VALUES (?,?,?,?,?,?)',
      [typeId['Party'], 'Amira’s birthday dinner', 'Rijeka', iso(-48), iso(-45), 70]
    );
    await db.runAsync(
      'INSERT INTO event (event_type_id, title, location, starts_at_utc, ends_at_utc, expected_drain) VALUES (?,?,?,?,?,?)',
      [typeId['Work meeting'], 'Sprint review with Kofi and Mei', 'Online', iso(-20), iso(-19), 35]
    );

    await db.runAsync(
      'INSERT INTO event_reflection (event_id, battery_before, battery_after, note, created_at_utc) VALUES (?,?,?,?,?)',
      [e1.lastInsertRowId, 60, 70, 'Razgovor uz kavu me je zapravo napunio. Šetnja kući uz Savu pomogla.', iso(24)]
    );

    type Seed = {
      hoursAgo: number;
      level: number;
      activity?: string;
      attendees?: string;
      impact?: number;
      notes?: string;
      moods: string[];
      eventId?: number;
    };
    const checkIns: Seed[] = [
      { hoursAgo: 30, level: 80, activity: 'Morning run', moods: ['energised', 'happy'], notes: 'Slept well.' },
      {
        hoursAgo: 26,
        level: 60,
        activity: 'Kava s Đurđom',
        attendees: 'Đurđa',
        impact: 4,
        notes: 'Čaj, kolači i dugi razgovor. Šteta što je kratko trajalo.',
        moods: ['calm', 'content'],
        eventId: e1.lastInsertRowId,
      },
      {
        hoursAgo: 6,
        level: 45,
        activity: 'Team stand-up',
        attendees: 'Kofi, Ivana, Priya',
        impact: 2,
        notes: 'Too many people talking at once.',
        moods: ['tired', 'irritable'],
      },
      {
        hoursAgo: 4,
        level: 55,
        activity: '友達とカフェ',
        attendees: 'さくら, Haruto',
        impact: 4,
        notes: '今日は静かなカフェでゆっくり話せて楽しかった。',
        moods: ['calm', 'happy'],
      },
      {
        hoursAgo: 2,
        level: 30,
        activity: 'قهوة مع ليلى',
        attendees: 'ليلى',
        impact: 3,
        notes: 'كان الحديث لطيفاً لكنني متعب بعد يوم طويل.',
        moods: ['tired', 'content'],
      },
      {
        hoursAgo: 0.5,
        level: 25,
        activity: 'Family dinner',
        attendees: 'Mama, Luka, Tía Carmen',
        impact: 1,
        notes: 'Loud, lots of questions about exams. Need a quiet evening: čitanje, tišina, šalica čaja.',
        moods: ['overwhelmed', 'anxious'],
      },
    ];

    for (const c of checkIns) {
      const ts = iso(c.hoursAgo);
      const r = await db.runAsync(
        `INSERT INTO check_in
           (battery_level, activity, attendees, impact_rating, notes, event_id, created_at_utc, updated_at_utc)
         VALUES (?,?,?,?,?,?,?,?)`,
        [c.level, c.activity ?? null, c.attendees ?? null, c.impact ?? null, c.notes ?? null, c.eventId ?? null, ts, ts]
      );
      for (const key of c.moods) {
        await db.runAsync(
          'INSERT OR IGNORE INTO check_in_mood (check_in_id, mood_id) SELECT ?, id FROM mood WHERE key = ?',
          [r.lastInsertRowId, key]
        );
      }
    }

    // keep e2 referenced so the upcoming-event seed is obviously intentional
    void e2;
  });
}

/** Journal sample data. Separate from seedIfEmpty so devices that already have check-ins still get it. */
export async function seedJournalIfEmpty(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM journal_entry');
  if ((row?.n ?? 0) > 0) return;

  const latest = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM check_in ORDER BY created_at_utc DESC LIMIT 1'
  );

  const entries: { hoursAgo: number; title: string | null; body: string; checkInId: number | null }[] = [
    {
      hoursAgo: 25,
      title: 'Kava uz Savu',
      body: 'Danas sam se vratio kući pun energije. Čaj, razgovor i šetnja – točno ono što mi treba.',
      checkInId: null,
    },
    {
      hoursAgo: 3,
      title: '静かな午後',
      body: '今日はカフェで友達と話して、心が軽くなった。次はもっと早く休もう。',
      checkInId: null,
    },
    {
      hoursAgo: 0.4,
      title: 'Family dinner was a lot',
      body: 'Everyone talked at once and I ran out of energy early. Next time I will take a short walk between courses.',
      checkInId: latest?.id ?? null,
    },
  ];

  for (const e of entries) {
    const ts = iso(e.hoursAgo);
    await db.runAsync(
      'INSERT INTO journal_entry (title, body, check_in_id, created_at_utc, updated_at_utc) VALUES (?,?,?,?,?)',
      [e.title, e.body, e.checkInId, ts, ts]
    );
  }
}
