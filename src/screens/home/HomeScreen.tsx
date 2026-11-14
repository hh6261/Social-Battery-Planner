import Slider from '@expo/ui/community/slider';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button as NativeButton, Pressable, View } from 'react-native';
import { AppText, Button, Card, Screen } from '../../components';
import { useCurrentUser } from '../../context/AuthContext';
import { getLatestBatteryLevel, listEventsForDay, type DayEvent } from '../../db/home';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { DRAIN_LABELS, drainLevel, formatTime } from '../../utils/drain';
import { TomorrowReminder } from './TomorrowReminder';

const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

/** Screen 6 · Home (wireframe), with the daily reminder pop-up (screen 7). */
export function HomeScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const { i18n } = useTranslation();
  const user = useCurrentUser();

  const [battery, setBattery] = useState<number | null>(null);
  const [level, setLevel] = useState(50);
  const [today, setToday] = useState<DayEvent[] | null>(null);

  // Refresh whenever Home comes into view (e.g. after finishing a check-in).
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([getLatestBatteryLevel(), listEventsForDay(new Date())])
        .then(([latest, events]) => {
          if (cancelled) return;
          setBattery(latest);
          if (latest !== null) setLevel(latest);
          setToday(events);
        })
        .catch(() => {
          if (!cancelled) setToday([]);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const dateLabel = new Date().toLocaleDateString(i18n.language, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Screen edges={['top']}>
      {/* Greeting */}
      <Card style={styles.card}>
        <AppText variant="eyebrow">{dateLabel}</AppText>
        <AppText variant="title" style={styles.greeting} accessibilityRole="header">
          {`Hello, ${user.username}. How are you?`}
        </AppText>
      </Card>

      {/* Estimated battery */}
      <Card style={styles.card} contentStyle={styles.batteryCard}>
        <View
          style={styles.battery}
          accessible
          accessibilityRole="image"
          accessibilityLabel={battery === null ? 'No battery estimate yet' : `Social battery about ${battery} percent`}
        >
          <View style={styles.batteryBody}>
            <View style={[styles.batteryFill, { width: `${battery ?? 0}%` }]} />
            <AppText variant="heading" style={styles.batteryLabel}>
              {battery === null ? '–' : `${battery}%`}
            </AppText>
          </View>
          <View style={styles.batteryTip} />
        </View>
        <View style={styles.batteryText}>
          <AppText variant="subheading">Estimated current social battery percentage</AppText>
          <AppText variant="bodySmall" color="muted" style={styles.batteryHint}>
            {battery === null ? 'Do a quick check-in below to get your first estimate' : 'Based on your latest check-in'}
          </AppText>
        </View>
      </Card>

      {/* Quick energy check-in */}
      <Card style={styles.card}>
        <View style={styles.rowBetween}>
          <AppText variant="subheading">Quick energy check-in</AppText>
          <AppText variant="subheading" accessibilityLiveRegion="polite">{`${level}%`}</AppText>
        </View>
        <Slider
          value={level}
          minimumValue={0}
          maximumValue={100}
          step={5}
          onValueChange={(v: number) => setLevel(clamp(v))}
          minimumTrackTintColor={theme.colors.ink}
          maximumTrackTintColor={theme.colors.line}
          thumbTintColor={theme.colors.ink}
          accessibilityLabel="Social battery level"
          style={styles.slider}
        />
        <View style={styles.rowBetween}>
          <AppText variant="eyebrow">Low</AppText>
          <AppText variant="eyebrow">High</AppText>
        </View>
        <Button
          label={`Check in at ${level}%`}
          size="md"
          onPress={() => router.push({ pathname: '/checkin/battery', params: { level: String(level) } })}
          accessibilityHint="Opens the check-in with this battery level"
          style={styles.checkInButton}
        />
      </Card>

      {/* Today's plans */}
      <Card style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <AppText variant="eyebrow">Today</AppText>
            <AppText variant="heading" accessibilityRole="header">
              Upcoming plans
            </AppText>
          </View>
          <Pressable
            onPress={() => router.push('/tracker')}
            accessibilityRole="button"
            accessibilityLabel="Add a plan"
            hitSlop={8}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Feather name="plus" size={20} color={theme.colors.ink} />
          </Pressable>
        </View>

        {today === null ? null : today.length === 0 ? (
          <AppText variant="bodySmall" color="muted" style={styles.empty}>
            Nothing planned for today.
          </AppText>
        ) : (
          <View style={styles.timeline}>
            {today.map((e, i) => (
              <View key={e.id} style={styles.planRow}>
                <View
                  style={styles.planCard}
                  accessible
                  accessibilityLabel={`${formatTime(e.startsAtUtc, i18n.language)}, ${e.title}, drain ${DRAIN_LABELS[drainLevel(e.drain)]}`}
                >
                  <AppText variant="label" align="right">
                    {formatTime(e.startsAtUtc, i18n.language)}
                  </AppText>
                  <AppText variant="subheading" align="right" numberOfLines={2}>
                    {e.title}
                  </AppText>
                  <AppText variant="bodySmall" color="muted" align="right">
                    {`Drain: ${DRAIN_LABELS[drainLevel(e.drain)]}`}
                  </AppText>
                </View>
                <View style={styles.track}>
                  <View style={[styles.trackLine, i === 0 && styles.trackLineFirst, i === today.length - 1 && styles.trackLineLast]} />
                  <View style={styles.trackDot} />
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>

      <TomorrowReminder />
    </Screen>
  );
}

const BATTERY_W = 120;
const BATTERY_H = 64;

const useStyles = makeStyles((t) => ({
  card: { marginBottom: t.spacing.lg },
  greeting: { marginTop: t.spacing.xs },
  batteryCard: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  battery: { flexDirection: 'row', alignItems: 'center' },
  batteryBody: {
    width: BATTERY_W,
    height: BATTERY_H,
    borderRadius: 14,
    borderWidth: t.borderWidth + 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    padding: 5,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  batteryFill: {
    position: 'absolute',
    left: 5,
    top: 5,
    bottom: 5,
    maxWidth: BATTERY_W - 16,
    borderRadius: 8,
    backgroundColor: t.colors.shadow,
  },
  batteryLabel: { textAlign: 'center' },
  batteryTip: {
    width: 6,
    height: BATTERY_H * 0.36,
    marginLeft: 2,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: t.colors.border,
  },
  batteryText: { flex: 1 },
  batteryHint: { marginTop: t.spacing.xxs },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  slider: { marginVertical: t.spacing.md, height: 40 },
  checkInButton: { marginTop: t.spacing.md },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: t.borderWidth,
    borderColor: t.colors.border,
    backgroundColor: t.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  empty: { marginTop: t.spacing.md },
  timeline: { marginTop: t.spacing.lg },
  planRow: { flexDirection: 'row', alignItems: 'stretch' },
  planCard: {
    flex: 1,
    maxWidth: 220,
    marginVertical: t.spacing.xs,
    padding: t.spacing.sm,
    borderRadius: t.radius.lg,
    borderWidth: t.borderWidth,
    borderColor: t.colors.subtle,
    backgroundColor: t.colors.card,
  },
  track: { width: 32, alignItems: 'center', justifyContent: 'center' },
  trackLine: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: t.colors.border },
  trackLineFirst: { top: '50%' },
  trackLineLast: { bottom: '50%' },
  trackDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: t.borderWidth,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
}));