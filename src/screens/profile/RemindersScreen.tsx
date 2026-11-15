import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppText,
  BackLink,
  ListGroup,
  ListRow,
  Screen,
  SectionLabel,
  SelectField,
  TimeField,
  Toggle,
} from '../../components';
import { frequencyOptions } from '../../constants/situations';
import { useSaveSettings } from '../../hooks/useSaveSettings';
import { router } from 'expo-router';
import { makeStyles } from '../../theme/ThemeProvider';

/**
 * Screen 29 · Reminders (reached from the Reminders row in Settings).
 * There's no wireframe for this one, so it reuses the Settings patterns.
 * It edits the same settings.reminders values as Settings, so both stay in sync.
 */
export function RemindersScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const { settings, save } = useSaveSettings();
  const { reminders, quietHours } = settings;
  const off = !reminders.enabled;

  const setReminder = <K extends keyof typeof reminders>(key: K, value: (typeof reminders)[K]) =>
    save((s) => ({ ...s, reminders: { ...s.reminders, [key]: value } }));

  return (
    <Screen edges={['top']}>
      <BackLink label={t('settings.title')} />
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        {t('settings.reminders')}
      </AppText>
      <AppText variant="body" color="muted">
        {t('reminders.intro')}
      </AppText>

      <SectionLabel>{t('reminders.daily')}</SectionLabel>
      <ListGroup>
        <ListRow
          title={t('settings.reminders')}
          subtitle={t('settings.remindersHint')}
          right={
            <Toggle value={reminders.enabled} onValueChange={(v) => setReminder('enabled', v)} accessibilityLabel={t('settings.reminders')} />
          }
        />
        <ListRow
          title={t('settings.frequency')}
          disabled={off}
          right={
            <SelectField
              title={t('settings.reminderFrequency')}
              value={reminders.frequency}
              options={frequencyOptions()}
              disabled={off}
              onChange={(v) => setReminder('frequency', v)}
            />
          }
        />
        <ListRow
          title={t('reminders.time')}
          subtitle={t('reminders.timeHint')}
          disabled={off}
          right={
            <TimeField
              value={reminders.time}
              disabled={off}
              accessibilityLabel={t('reminders.timeLabel')}
              onChange={(v) => setReminder('time', v)}
            />
          }
        />
      </ListGroup>

      <SectionLabel>{t('reminders.include')}</SectionLabel>
      <ListGroup>
        <ListRow
          title={t('reminders.estimate')}
          subtitle={t('reminders.estimateHint')}
          disabled={off}
          right={
            <Toggle
              value={reminders.includeDrainEstimate}
              disabled={off}
              onValueChange={(v) => setReminder('includeDrainEstimate', v)}
              accessibilityLabel={t('reminders.estimateLabel')}
            />
          }
        />
        <ListRow
          title={t('reminders.plans')}
          subtitle={t('reminders.plansHint')}
          disabled={off}
          right={
            <Toggle
              value={reminders.planReminders}
              disabled={off}
              onValueChange={(v) => setReminder('planReminders', v)}
              accessibilityLabel={t('reminders.plansLabel')}
            />
          }
        />
      </ListGroup>

      <SectionLabel>{t('settings.quietHours')}</SectionLabel>
      <ListGroup style={styles.lastGroup}>
        <ListRow
          title={`${quietHours.from} – ${quietHours.to}`}
          subtitle={t('reminders.quietHint')}
          onPress={() => router.back()}
        />
      </ListGroup>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  title: { marginTop: t.spacing.lg, marginBottom: t.spacing.xs },
  lastGroup: { marginBottom: t.spacing.md },
}));
