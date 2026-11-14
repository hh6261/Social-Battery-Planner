import { useCallback } from 'react';
import { useDialog } from '../components/DialogProvider';
import { useSettings } from '../context/SettingsContext';
import type { UserSettings } from '../services';

/** updateSettings + a friendly dialog when saving fails (change is rolled back). */
export function useSaveSettings() {
  const { settings, updateSettings } = useSettings();
  const { showMessage } = useDialog();

  const save = useCallback(
    (updater: (s: UserSettings) => UserSettings) =>
      updateSettings(updater).catch(() =>
        showMessage('Couldn’t save that change', 'Please check your connection and try again.'),
      ),
    [updateSettings, showMessage],
  );

  return { settings, save };
}
