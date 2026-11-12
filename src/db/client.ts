import * as SQLite from 'expo-sqlite';
import { migrations } from './migrations';
import { seedIfEmpty, seedJournalIfEmpty } from './seed';

const DB_NAME = 'social-battery.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Single shared connection. Opens, enables foreign keys, runs migrations. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = open().catch((err) => {
      dbPromise = null; // allow retry
      throw err;
    });
  }
  return dbPromise;
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  return db;
}

/** Runs pending migrations in order, tracked with PRAGMA user_version. */
export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  const pending = migrations.filter((m) => m.version > current).sort((a, b) => a.version - b.version);

  for (const m of pending) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(m.sql);
      await db.execAsync(`PRAGMA user_version = ${m.version}`);
    });
  }
}

/** Call once at app start (e.g. in your root layout). */
export async function initDatabase(options: { seed?: boolean } = { seed: true }): Promise<void> {
  const db = await getDb();
  if (options.seed) {
    await seedIfEmpty(db);
    await seedJournalIfEmpty(db);
  }
}
