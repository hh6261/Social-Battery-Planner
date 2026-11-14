import React from 'react';
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
import { FREQUENCY_OPTIONS } from '../../constants/situations';
import { useSaveSettings } from '../../hooks/useSaveSettings';
import { router } from 'expo-router';
import { makeStyles } from '../../theme/ThemeProvider';

/**
 * Screen 29 · Reminders (reached from the Reminders row in Settings).
 * There's no wireframe for this one, so it reuses the Settings patterns.
 * It edits the same settings.reminders values as Settings, so both stay in sync.
 */
export function RemindersScreen() {
  const styles = useStyles();
  const { settings, save } = useSaveSettings();
  const { reminders, quietHours } = settings;
  const off = !reminders.enabled;

  const setReminder = <K extends keyof typeof reminders>(key: K, value: (typeof reminders)[K]) =>
    save((s) => ({ ...s, reminders: { ...s.reminders, [key]: value } }));

  return (
    <Screen edges={['top']}>
      <BackLink label="Settings" />
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        Reminders
      </AppText>
      <AppText variant="body" color="muted">
        Choose when gentle check-ins reach you, and what they include.
      </AppText>

      <SectionLabel>Daily check-in</SectionLabel>
      <ListGroup>
        <ListRow
          title="Reminders"
          subtitle="Gentle check-ins and notifications"
          right={
            <Toggle value={reminders.enabled} onValueChange={(v) => setReminder('enabled', v)} accessibilityLabel="Reminders" />
          }
        />
        <ListRow
          title="Frequency"
          disabled={off}
          right={
            <SelectField
              title="Reminder frequency"
              value={reminders.frequency}
              options={FREQUENCY_OPTIONS}
              disabled={off}
              onChange={(v) => setReminder('frequency', v)}
            />
          }
        />
        <ListRow
          title="Time"
          subtitle="When the check-in arrives"
          disabled={off}
          right={
            <TimeField
              value={reminders.time}
              disabled={off}
              accessibilityLabel="Reminder time"
              onChange={(v) => setReminder('time', v)}
            />
          }
        />
      </ListGroup>

      <SectionLabel>What to include</SectionLabel>
      <ListGroup>
        <ListRow
          title="Tomorrow’s estimate"
          subtitle="An estimate of the next day’s social battery drain, so you can plan ahead"
          disabled={off}
          right={
            <Toggle
              value={reminders.includeDrainEstimate}
              disabled={off}
              onValueChange={(v) => setReminder('includeDrainEstimate', v)}
              accessibilityLabel="Include tomorrow’s estimate"
            />
          }
        />
        <ListRow
          title="Upcoming plans"
          subtitle="A heads-up before plans in your journal"
          disabled={off}
          right={
            <Toggle
              value={reminders.planReminders}
              disabled={off}
              onValueChange={(v) => setReminder('planReminders', v)}
              accessibilityLabel="Upcoming plan reminders"
            />
          }
        />
      </ListGroup>

      <SectionLabel>Quiet hours</SectionLabel>
      <ListGroup style={styles.lastGroup}>
        <ListRow
          title={`${quietHours.from} – ${quietHours.to}`}
          subtitle="No reminders during quiet hours. Change them in Settings."
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
