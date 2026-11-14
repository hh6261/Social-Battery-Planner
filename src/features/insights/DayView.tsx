import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ScreenState } from '@/components/ScreenState';
import { listCheckInsByDay } from '@/db/checkIns';
import type { CheckIn } from '@/db/types';
import { addDays, startOfDay } from '@/features/planner/dates';
import { formatDayHeading, formatList, formatPercent, formatTime } from '@/i18n/format';
import { colors, minTouchSize, spacing } from '@/theme/colors';

import { bandOf, chartX, type Band } from './insightsLogic';

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; items: CheckIn[] };

const bandColor: Record<Band, string> = {
  high: colors.batteryHigh,
  medium: colors.batteryMid,
  low: colors.batteryLow,
};

const CHART_HEIGHT = 168;
const DOT = 14;

/** Daily Timeline (merged screen 20, Roko's wireframe 01). */
export default function DayView() {
  const { t } = useTranslation();
  const today = startOfDay(new Date());
  const [day, setDay] = useState<Date>(today);
  const [state, setState] = useState<State>({ status: 'loading' });
  const [reload, setReload] = useState(0);
  const isToday = day.getTime() === today.getTime();

  useEffect(() => {
    let cancelled = false;
    listCheckInsByDay(day)
      .then((items) => {
        if (!cancelled) setState({ status: 'ready', items });
      })
      .catch((e) => {
        if (__DEV__) console.warn('[insights] day failed', e);
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [day, reload]);

  // New check-ins may have been saved while this screen was in the background.
  useFocusEffect(useCallback(() => setReload((n) => n + 1), []));

  const changeDay = (delta: number) => {
    setState({ status: 'loading' });
    setDay((d) => addDays(d, delta));
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {/* Date arrows */}
      <View style={styles.dateRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('insights.day.previous')}
          onPress={() => changeDay(-1)}
          style={styles.arrow}
        >
          <Text style={styles.arrowText} importantForAccessibility="no">
            ‹
          </Text>
        </Pressable>
        <Text style={styles.dateText} accessibilityRole="header" accessibilityLiveRegion="polite">
          {isToday ? t('insights.day.today') : formatDayHeading(day)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('insights.day.next')}
          accessibilityState={{ disabled: isToday }}
          disabled={isToday}
          onPress={() => changeDay(1)}
          style={[styles.arrow, isToday && styles.arrowDisabled]}
        >
          <Text style={styles.arrowText} importantForAccessibility="no">
            ›
          </Text>
        </Pressable>
      </View>

      {state.status === 'loading' && <ScreenState kind="loading" />}
      {state.status === 'error' && (
        <ScreenState
          kind="error"
          title={t('insights.loadError')}
          onAction={() => {
            setState({ status: 'loading' });
            setReload((n) => n + 1);
          }}
        />
      )}
      {state.status === 'ready' && state.items.length === 0 && (
        <View style={styles.emptyBox}>
          <ScreenState
            kind="empty"
            title={t('insights.day.empty.title')}
            message={t('insights.day.empty.message')}
            onAction={isToday ? () => router.push('/checkin/battery') : undefined}
            actionLabel={t('insights.day.checkInNow')}
          />
        </View>
      )}
      {state.status === 'ready' && state.items.length > 0 && (
        <>
          <DayChart items={state.items} showNow={isToday} />
          <Text style={styles.sectionTitle} accessibilityRole="header">
            {t('insights.day.checkIns', { count: state.items.length })}
          </Text>
          {state.items.map((c) => (
            <CheckInRow key={c.id} item={c} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

/**
 * The chart from the wireframe: High / Medium / Low bands from 06:00 to 24:00,
 * one dot per recorded check-in and a dashed line for "now". Screen readers get a
 * one-sentence summary; the list under the chart has every check-in as text.
 */
function DayChart({ items, showNow }: { items: CheckIn[]; showNow: boolean }) {
  const { t } = useTranslation();
  const [width, setWidth] = useState(0);
  const levels = items.map((c) => c.batteryLevel);
  const hourLabels = [6, 12, 18, 24].map((h) => {
    const d = new Date();
    d.setHours(h === 24 ? 0 : h, 0, 0, 0);
    return { h, label: formatTime(d) };
  });

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('insights.day.chartSummary', {
        count: items.length,
        min: formatPercent(Math.min(...levels) / 100),
        max: formatPercent(Math.max(...levels) / 100),
      })}
    >
      <View style={styles.chartRow}>
        <View style={styles.bandLabels}>
          {(['high', 'medium', 'low'] as Band[]).map((b) => (
            <Text key={b} style={styles.bandLabel}>
              {t(`insights.band.${b}`)}
            </Text>
          ))}
        </View>
        <View style={styles.chart} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          <View style={[styles.band, styles.bandTop]} />
          <View style={styles.band} />
          <View style={styles.band} />
          {showNow && width > 0 && (
            <View style={[styles.nowLine, { left: chartX(new Date()) * width }]}>
              <Text style={styles.nowText}>{t('insights.day.now')}</Text>
            </View>
          )}
          {width > 0 &&
            items.map((c) => (
              <View
                key={c.id}
                style={[
                  styles.dot,
                  {
                    left: chartX(new Date(c.createdAtUtc)) * width - DOT / 2,
                    top: ((100 - c.batteryLevel) / 100) * CHART_HEIGHT - DOT / 2,
                    backgroundColor: bandColor[bandOf(c.batteryLevel)],
                  },
                ]}
              />
            ))}
        </View>
      </View>
      <View style={styles.hourRow}>
        {hourLabels.map(({ h, label }) => (
          <Text key={h} style={styles.hourLabel}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function CheckInRow({ item }: { item: CheckIn }) {
  const { t } = useTranslation();
  const band = bandOf(item.batteryLevel);
  const moods = item.moods.map((m) => t(`checkin.mood.options.${m}`, { defaultValue: m }));

  return (
    <View style={styles.row}>
      <Text style={styles.rowTime}>{formatTime(new Date(item.createdAtUtc))}</Text>
      <View style={styles.rowBody}>
        {/* Percentage and band word as text, so the colour is never the only signal. */}
        <Text style={[styles.rowLevel, { color: bandColor[band] }]}>
          {t('insights.day.level', {
            percent: formatPercent(item.batteryLevel / 100),
            band: t(`insights.band.${band}`),
          })}
        </Text>
        {item.activity ? <Text style={styles.rowText}>{item.activity}</Text> : null}
        {moods.length > 0 && <Text style={styles.rowMuted}>{formatList(moods)}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: {
    width: minTouchSize,
    height: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: minTouchSize / 2,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  arrowDisabled: { borderColor: colors.track },
  arrowText: { fontSize: 26, color: colors.primary, lineHeight: 28 },
  dateText: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text },
  emptyBox: { minHeight: 260 },
  chartRow: { flexDirection: 'row', gap: spacing.sm },
  bandLabels: { height: CHART_HEIGHT, justifyContent: 'space-around' },
  bandLabel: { fontSize: 12, color: colors.textMuted },
  chart: { flex: 1, height: CHART_HEIGHT, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  band: { flex: 1, borderBottomWidth: 1, borderColor: colors.track, borderStyle: 'dashed' },
  bandTop: { borderTopWidth: 0 },
  nowLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.textMuted,
  },
  nowText: { fontSize: 11, color: colors.textMuted, marginLeft: 3 },
  dot: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 2, borderColor: colors.background },
  hourRow: { flexDirection: 'row', justifyContent: 'space-between', marginLeft: 48 },
  hourLabel: { fontSize: 12, color: colors.textMuted },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  rowTime: { fontSize: 16, fontWeight: '700', color: colors.text, minWidth: 52 },
  rowBody: { flex: 1, gap: 2 },
  rowLevel: { fontSize: 15, fontWeight: '700' },
  rowText: { fontSize: 15, color: colors.text },
  rowMuted: { fontSize: 14, color: colors.textMuted },
});
