import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDialog } from '../components/DialogProvider';
import { useSettings } from '../context/SettingsContext';
import type { UserSettings } from '../services';

/** updateSettings + a friendly dialog when saving fails (change is rolled back). */
export function useSaveSettings() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const { showMessage } = useDialog();

  const save = useCallback(
    (updater: (s: UserSettings) => UserSettings) =>
      updateSettings(updater).catch(() => showMessage(t('settings.saveFailedTitle'), t('settings.saveFailedMessage'))),
    [updateSettings, showMessage, t],
  );

  return { settings, save };
}
