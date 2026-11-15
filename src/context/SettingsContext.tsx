import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SETTINGS } from '../constants/situations';
import { dataService, UserSettings } from '../services';
import { useAuth } from './AuthContext';

interface SettingsContextValue {
  settings: UserSettings;
  loading: boolean;
  /**
   * Apply a change immediately (optimistic) and save it.
   * If saving fails the change is rolled back and the promise rejects.
   */
  updateSettings(updater: (current: UserSettings) => UserSettings): Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  // The loaded settings are stored together with the user they belong to. When nobody is
  // signed in (or a different user signed in) the defaults are shown, with no effect needed.
  const [loaded, setLoaded] = useState<{ userId: string; settings: UserSettings } | null>(null);
  const latest = useRef<UserSettings>(DEFAULT_SETTINGS);

  const ready = userId !== null && loaded?.userId === userId;
  const settings = ready && loaded ? loaded.settings : DEFAULT_SETTINGS;
  const loading = userId !== null && !ready;

  useEffect(() => {
    if (userId === null) return;
    let cancelled = false;
    dataService
      .getSettings(userId)
      .then((s) => {
        if (cancelled) return;
        latest.current = s;
        setLoaded({ userId, settings: s });
      })
      .catch(() => {
        // Keep defaults; the next successful save will create the record.
        if (cancelled) return;
        latest.current = DEFAULT_SETTINGS;
        setLoaded({ userId, settings: DEFAULT_SETTINGS });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const updateSettings = useCallback(
    async (updater: (current: UserSettings) => UserSettings) => {
      if (userId === null) return;
      const previous = latest.current;
      const next = updater(previous);
      latest.current = next;
      setLoaded({ userId, settings: next });
      try {
        await dataService.saveSettings(userId, next);
      } catch (error) {
        latest.current = previous;
        setLoaded({ userId, settings: previous });
        throw error;
      }
    },
    [userId],
  );

  const value = useMemo(() => ({ settings, loading, updateSettings }), [settings, loading, updateSettings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
