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
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const latest = useRef(settings);
  latest.current = settings;

  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      return;
    }
    let cancelled = false;
    setLoading(true);
    dataService
      .getSettings(user.id)
      .then((loaded) => {
        if (!cancelled) setSettings(loaded);
      })
      .catch(() => {
        // Keep defaults; the next successful save will create the record.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateSettings = useCallback(
    async (updater: (current: UserSettings) => UserSettings) => {
      const previous = latest.current;
      const next = updater(previous);
      setSettings(next);
      if (!user) return;
      try {
        await dataService.saveSettings(user.id, next);
      } catch (error) {
        setSettings(previous);
        throw error;
      }
    },
    [user],
  );

  const value = useMemo(() => ({ settings, loading, updateSettings }), [settings, loading, updateSettings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
