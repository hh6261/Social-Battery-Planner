import { useCallback, useEffect, useRef, useState } from 'react';
import { dataService, UserPreferences } from '../services';

/**
 * Loads the user's stressors/relaxers and saves edits optimistically.
 * Used by the Profile screen.
 */
export function usePreferences(userId: string) {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef<UserPreferences | null>(null);
  latest.current = prefs;

  const reload = useCallback(async () => {
    try {
      setError(null);
      setPrefs(await dataService.getPreferences(userId));
    } catch {
      setError('We couldn’t load your preferences.');
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const update = useCallback(
    async (updater: (current: UserPreferences) => UserPreferences) => {
      const previous = latest.current;
      if (!previous) return;
      const next = updater(previous);
      setPrefs(next);
      try {
        await dataService.savePreferences(userId, next);
      } catch (e) {
        setPrefs(previous);
        throw e;
      }
    },
    [userId],
  );

  return { prefs, error, reload, update };
}
