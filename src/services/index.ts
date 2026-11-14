/**
 * The single place the app gets its data layer from.
 *
 * The app uses the on-device SQLite database (src/db). For UI work without
 * a database (e.g. Storybook or a web preview), you can swap in
 * createMockDataService() from './mockDataService' instead.
 */
import { createSqliteDataService } from './sqliteDataService';
import type { DataService } from './types';

export const dataService: DataService = createSqliteDataService();

export * from './types';
