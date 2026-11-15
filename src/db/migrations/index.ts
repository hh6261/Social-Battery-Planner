import { migration001 } from './001_init';
import { migration002 } from './002_journal';
import { migration003 } from './003_wheel_moods';
import { migration004 } from './004_event_planner';
import { migration005 } from './005_recharge_list';
import { migration006 } from './006_account_preferences_settings';
import { migration007 } from './007_checkin_details';
import { migration008 } from './008_checkin_weather';
import { migration009 } from './009_colorblind_theme';

export type Migration = { version: number; sql: string };

// Add new migrations to the end (010_..., 011_...). Never edit an old one after release.
export const migrations: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
  migration006,
  migration007,
  migration008,
  migration009,
];
