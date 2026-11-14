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
import { FONT_SIZE_OPTIONS, FREQUENCY_OPTIONS, THEME_OPTIONS } from '../../constants/situations';
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
];
/** Screen 28 · Settings (includes the Log out dialog) */
export function SettingsScreen() {
  const styles = useStyles();
  const { signOut } = useAuth();
  const { settings, save } = useSaveSettings();
  const { reminders, quietHours, display } = settings;
  const { i18n } = useTranslation();
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
      setLogoutError('We couldn’t log you out. Please try again.');
    }
  };

  return (
    <Screen edges={['top']}>
      <BackLink label="Profile" />
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        Settings
      </AppText>
      <AppText variant="body" color="muted">
        Adjust the app in ways that feel comfortable for you.
      </AppText>

      <SectionLabel>Reminders</SectionLabel>
      <ListGroup>
        <ListRow
          title="Reminders"
          subtitle="Gentle check-ins and notifications"
          right={
            <Toggle
              value={reminders.enabled}
              onValueChange={(enabled) => save((s) => ({ ...s, reminders: { ...s.reminders, enabled } }))}
              accessibilityLabel="Reminders"
            />
          }
        />
        <ListRow
          title="Frequency"
          disabled={!reminders.enabled}
          right={
            <SelectField
              title="Reminder frequency"
              value={reminders.frequency}
              options={FREQUENCY_OPTIONS}
              disabled={!reminders.enabled}
              onChange={(frequency) => save((s) => ({ ...s, reminders: { ...s.reminders, frequency } }))}
            />
          }
        />
        <ListRow
          title="Reminder time & content"
          subtitle={reminders.enabled ? `Around ${reminders.time}` : 'Reminders are off'}
          onPress={() => router.push('/profile/reminders')}
        />
      </ListGroup>

      <SectionLabel>Quiet hours</SectionLabel>
      <ListGroup>
        <ListRow
          title="From"
          subtitle="Quiet hours begin"
          right={
            <TimeField
              value={quietHours.from}
              accessibilityLabel="Quiet hours begin"
              onChange={(from) => save((s) => ({ ...s, quietHours: { ...s.quietHours, from } }))}
            />
          }
        />
        <ListRow
          title="To"
          subtitle="Quiet hours end"
          right={
            <TimeField
              value={quietHours.to}
              accessibilityLabel="Quiet hours end"
              onChange={(to) => save((s) => ({ ...s, quietHours: { ...s.quietHours, to } }))}
            />
          }
        />
        <ListRow
          title="Frequency"
          right={
            <SelectField
              title="Quiet hours frequency"
              value={quietHours.frequency}
              options={FREQUENCY_OPTIONS}
              onChange={(frequency) => save((s) => ({ ...s, quietHours: { ...s.quietHours, frequency } }))}
            />
          }
        />
      </ListGroup>

      <SectionLabel>Display</SectionLabel>
      <ListGroup>
        <ListRow
          title="App theme"
          right={
            <SelectField
              title="App theme"
              value={display.theme}
              options={THEME_OPTIONS}
              onChange={(theme) => save((s) => ({ ...s, display: { ...s.display, theme } }))}
            />
          }
        />
        <ListRow
          title="Font size"
          right={
            <SelectField
              title="Font size"
              value={display.fontSize}
              options={FONT_SIZE_OPTIONS}
              onChange={(fontSize) => save((s) => ({ ...s, display: { ...s.display, fontSize } }))}
            />
          }
        />
      </ListGroup>

      <SectionLabel>Account</SectionLabel>
      <SectionLabel>Accessibility</SectionLabel>
      <ListGroup>
        <ListRow
          title="Language"
          right={
            <SelectField
              title="Language"
              value={currentLanguage}
              options={LANGUAGE_OPTIONS}
              onChange={(language) =>
                changeLocale(language).catch(() =>
                  showMessage('Couldn’t change the language', 'Please try again.'),
                )
              }
            />
          }
        />
      </ListGroup>
      <ListGroup style={styles.lastGroup}>
        <ListRow title="Log out" onPress={() => setLogoutOpen(true)} />
      </ListGroup>

      {__DEV__ && (
        <>
          <SectionLabel>Developer</SectionLabel>
          <ListGroup style={styles.lastGroup}>
            <ListRow
              title="Database viewer"
              subtitle="Development builds only"
              emphasis={false}
              onPress={() => router.push('/dev-db')}
            />
          </ListGroup>
        </>
      )}

      <AppDialog
        visible={logoutOpen}
        title="Log out now?"
        message="You’re about to log out of Social Battery. Are you comfortable continuing?"
        primaryLabel="Log out"
        onPrimary={logOut}
        primaryLoading={loggingOut}
        secondaryLabel="Cancel"
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
