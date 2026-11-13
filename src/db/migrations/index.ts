import { migration001 } from './001_init';
import { migration002 } from './002_journal';
import { migration003 } from './003_wheel_moods';
import { migration004 } from './004_event_planner';
import { migration005 } from './005_recharge_list';

export type Migration = { version: number; sql: string };

// Add new migrations to the end (004_..., 005_...). Never edit an old one after release.
export const migrations: Migration[] = [migration001, migration002, migration003, migration004, migration005];