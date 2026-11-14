import React, { useState } from 'react';
import {
  AppDialog,
  AppText,
  BackLink,
  ListGroup,
  ListRow,
  Screen,
  SectionLabel,
  SelectField,
  TimeField,
  Toggle,
  useDialog,
} from '../../components';
import { fontSizeOptions, frequencyOptions, themeOptions } from '../../constants/situations';
import { useAuth } from '../../context/AuthContext';
import { useSaveSettings } from '../../hooks/useSaveSettings';
import { router } from 'expo-router';
import { makeStyles } from '../../theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LOCALES, type AppLocale } from '../../i18n';
import { changeLocale } from '../../i18n/locale';

/** Each language is shown in its own language, so anyone can find theirs. */
const LANGUAGE_OPTIONS: readonly { value: AppLocale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hr', label: 'Hrvatski' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ar', label: 'العربية' },
];

/** Screen 28 · Settings (includes the Log out dialog) */
export function SettingsScreen() {
  const styles = useStyles();
  const { signOut } = useAuth();
  const { settings, save } = useSaveSettings();
  const { reminders, quietHours, display } = settings;
  const { t, i18n } = useTranslation();
  const { showMessage } = useDialog();
  const currentLanguage: AppLocale = (SUPPORTED_LOCALES as readonly string[]).includes(i18n.language)
    ? (i18n.language as AppLocale)
    : 'en';

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const logOut = async () => {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await signOut();
      // RootNavigator swaps back to the Splash screen.
    } catch {
      setLoggingOut(false);
      setLogoutError(t('settings.logoutError'));
    }
  };

  return (
    <Screen edges={['top']}>
      <BackLink label={t('tabs.profile')} />
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        {t('settings.title')}
      </AppText>
      <AppText variant="body" color="muted">
        {t('settings.intro')}
      </AppText>

      <SectionLabel>{t('settings.remindersSection')}</SectionLabel>
      <ListGroup>
        <ListRow
          title={t('settings.reminders')}
          subtitle={t('settings.remindersHint')}
          right={
            <Toggle
              value={reminders.enabled}
              onValueChange={(enabled) => save((s) => ({ ...s, reminders: { ...s.reminders, enabled } }))}
              accessibilityLabel={t('settings.reminders')}
            />
          }
        />
        <ListRow
          title={t('settings.frequency')}
          disabled={!reminders.enabled}
          right={
            <SelectField
              title={t('settings.reminderFrequency')}
              value={reminders.frequency}
              options={frequencyOptions()}
              disabled={!reminders.enabled}
              onChange={(frequency) => save((s) => ({ ...s, reminders: { ...s.reminders, frequency } }))}
            />
          }
        />
        <ListRow
          title={t('settings.timeAndContent')}
          subtitle={reminders.enabled ? t('settings.around', { time: reminders.time }) : t('settings.remindersOff')}
          onPress={() => router.push('/profile/reminders')}
        />
      </ListGroup>

      <SectionLabel>{t('settings.quietHours')}</SectionLabel>
      <ListGroup>
        <ListRow
          title={t('settings.from')}
          subtitle={t('settings.quietBegin')}
          right={
            <TimeField
              value={quietHours.from}
              accessibilityLabel={t('settings.quietBegin')}
              onChange={(from) => save((s) => ({ ...s, quietHours: { ...s.quietHours, from } }))}
            />
          }
        />
        <ListRow
          title={t('settings.to')}
          subtitle={t('settings.quietEnd')}
          right={
            <TimeField
              value={quietHours.to}
              accessibilityLabel={t('settings.quietEnd')}
              onChange={(to) => save((s) => ({ ...s, quietHours: { ...s.quietHours, to } }))}
            />
          }
        />
        <ListRow
          title={t('settings.frequency')}
          right={
            <SelectField
              title={t('settings.quietFrequency')}
              value={quietHours.frequency}
              options={frequencyOptions()}
              onChange={(frequency) => save((s) => ({ ...s, quietHours: { ...s.quietHours, frequency } }))}
            />
          }
        />
      </ListGroup>

      <SectionLabel>{t('settings.display')}</SectionLabel>
      <ListGroup>
        <ListRow
          title={t('settings.theme')}
          subtitle={t('settings.themeHint')}
          right={
            <SelectField
              title={t('settings.theme')}
              value={display.theme}
              options={themeOptions()}
              onChange={(theme) => save((s) => ({ ...s, display: { ...s.display, theme } }))}
            />
          }
        />
        <ListRow
          title={t('settings.fontSize')}
          right={
            <SelectField
              title={t('settings.fontSize')}
              value={display.fontSize}
              options={fontSizeOptions()}
              onChange={(fontSize) => save((s) => ({ ...s, display: { ...s.display, fontSize } }))}
            />
          }
        />
      </ListGroup>

      <SectionLabel>{t('settings.accessibility')}</SectionLabel>
      <ListGroup>
        <ListRow
          title={t('settings.language')}
          right={
            <SelectField
              title={t('settings.language')}
              value={currentLanguage}
              options={LANGUAGE_OPTIONS}
              onChange={(language) =>
                changeLocale(language)
                  .then((restartNeeded) => {
                    if (restartNeeded) showMessage(t('settings.restartTitle'), t('settings.restartMessage'));
                  })
                  .catch(() => showMessage(t('settings.languageErrorTitle'), t('settings.languageErrorMessage')))
              }
            />
          }
        />
      </ListGroup>
      <ListGroup style={styles.lastGroup}>
        <ListRow title={t('settings.logOut')} onPress={() => setLogoutOpen(true)} />
      </ListGroup>

      {__DEV__ && (
        <>
          <SectionLabel>{t('settings.developer')}</SectionLabel>
          <ListGroup style={styles.lastGroup}>
            <ListRow
              title={t('settings.dbViewer')}
              subtitle={t('settings.devOnly')}
              emphasis={false}
              onPress={() => router.push('/dev-db')}
            />
          </ListGroup>
        </>
      )}

      <AppDialog
        visible={logoutOpen}
        title={t('settings.logoutTitle')}
        message={t('settings.logoutMessage')}
        primaryLabel={t('settings.logOut')}
        onPrimary={logOut}
        primaryLoading={loggingOut}
        secondaryLabel={t('common.cancel')}
        onSecondary={() => {
          setLogoutOpen(false);
          setLogoutError(null);
        }}
      >
        {logoutError ? (
          <AppText variant="bodySmall" color="error">
            {logoutError}
          </AppText>
        ) : null}
      </AppDialog>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  title: { marginTop: t.spacing.lg, marginBottom: t.spacing.xs },
  lastGroup: { marginBottom: t.spacing.md },
}));
