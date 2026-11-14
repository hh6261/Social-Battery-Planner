import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dataService, UserPreferences } from '../services';

/**
 * Loads the user's stressors/relaxers and saves edits optimistically.
 * Used by the Profile screen.
 */
export function usePreferences(userId: string) {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef<UserPreferences | null>(null);

  const load = useCallback(() => {
    setError(null);
    return dataService
      .getPreferences(userId)
      .then((loaded) => {
        latest.current = loaded;
        setPrefs(loaded);
      })
      .catch(() => setError(t('profile.loadError')));
  }, [userId, t]);

  // Loading on mount: state is only set inside the promise callbacks.
  useEffect(() => {
    let cancelled = false;
    dataService
      .getPreferences(userId)
      .then((loaded) => {
        if (cancelled) return;
        latest.current = loaded;
        setPrefs(loaded);
      })
      .catch(() => {
        if (!cancelled) setError(t('profile.loadError'));
      });
    return () => {
      cancelled = true;
    };
  }, [userId, t]);

  const update = useCallback(
    async (updater: (current: UserPreferences) => UserPreferences) => {
      const previous = latest.current;
      if (!previous) return;
      const next = updater(previous);
      latest.current = next;
      setPrefs(next);
      try {
        await dataService.savePreferences(userId, next);
      } catch (e) {
        latest.current = previous;
        setPrefs(previous);
        throw e;
      }
    },
    [userId],
  );

  return { prefs, error, reload: load, update };
}
