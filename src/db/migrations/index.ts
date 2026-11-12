import { migration001 } from './001_init';
import { migration002 } from './002_journal';

export type Migration = { version: number; sql: string };

// Add new migrations to the end (003_..., 004_...). Never edit an old one after release.
export const migrations: Migration[] = [migration001, migration002];
