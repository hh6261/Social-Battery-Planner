import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ScreenState } from '@/components/ScreenState';
import { listCheckInsInRange } from '@/db/checkIns';
import { addDays } from '@/features/planner/dates';
import {
  formatDayMonth,
  formatPercent,
  formatWeekdayShort,
} from '@/i18n/format';
import { type LegacyColors, makeLegacyStyles, minTouchSize, useLegacyColors } from '@/theme/legacy';

import {
  bandOf,
  startOfWeek,
  summarizeWeek,
  weekStats,
  type Band,
  type DayStats,
  type WeekSummary,
} from './insightsLogic';

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; days: DayStats[]; summary: WeekSummary };

const bandColors = (colors: LegacyColors): Record<Band, string> => ({
  high: colors.batteryHigh,
  medium: colors.batteryMid,
  low: colors.batteryLow,
});

const BAR_AREA = 150;

/** Weekly Overview (merged screen 21, Roko's wireframe 02). */
export default function WeekView() {
  const styles = useStyles();
  const { t } = useTranslation();
  const thisWeek = startOfWeek(new Date());
  const [weekStart, setWeekStart] = useState<Date>(thisWeek);
  const [state, setState] = useState<State>({ status: 'loading' });
  const [reload, setReload] = useState(0);
  const isThisWeek = weekStart.getTime() === thisWeek.getTime();

  useEffect(() => {
    let cancelled = false;
    const lastWeekStart = addDays(weekStart, -7);
    Promise.all([
      listCheckInsInRange(weekStart, addDays(weekStart, 7)),
      listCheckInsInRange(lastWeekStart, weekStart),
    ])
      .then(([items, lastWeek]) => {
        if (cancelled) return;
        const days = weekStats(items, weekStart);
        setState({ status: 'ready', days, summary: summarizeWeek(days, lastWeek) });
      })
      .catch((e) => {
        if (__DEV__) console.warn('[insights] week failed', e);
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [weekStart, reload]);

  useFocusEffect(useCallback(() => setReload((n) => n + 1), []));

  const changeWeek = (delta: number) => {
    setState({ status: 'loading' });
    setWeekStart((w) => addDays(w, delta * 7));
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.dateRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('insights.week.previous')}
          onPress={() => changeWeek(-1)}
          style={styles.arrow}
        >
          <Text style={styles.arrowText} importantForAccessibility="no">
            ‹
          </Text>
        </Pressable>
        <Text style={styles.dateText} accessibilityRole="header" accessibilityLiveRegion="polite">
          {t('insights.week.range', {
            start: formatDayMonth(weekStart),
            end: formatDayMonth(addDays(weekStart, 6)),
          })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('insights.week.next')}
          aria-disabled={isThisWeek}
          disabled={isThisWeek}
          onPress={() => changeWeek(1)}
          style={[styles.arrow, isThisWeek && styles.arrowDisabled]}
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
      {state.status === 'ready' && (
        <>
          <WeekBars days={state.days} />
          <SummaryBox summary={state.summary} />
        </>
      )}
    </ScrollView>
  );
}

/** One column per day: the bar spans the lowest to the highest battery of that day. */
function WeekBars({ days }: { days: DayStats[] }) {
  const styles = useStyles();
  const colors = useLegacyColors();
  const bandColor = bandColors(colors);
  const { t } = useTranslation();
  return (
    <View style={styles.bars}>
      {days.map((d) => {
        const weekday = formatWeekdayShort(d.date);
        const label =
          d.avg === null
            ? t('insights.week.dayNoData', { day: weekday })
            : t('insights.week.dayLabel', {
                day: weekday,
                min: formatPercent(d.min! / 100),
                max: formatPercent(d.max! / 100),
                avg: formatPercent(d.avg / 100),
              });
        return (
          <View key={d.date.toISOString()} style={styles.barColumn} accessible accessibilityLabel={label}>
            <View style={styles.barArea}>
              {d.avg !== null && (
                <View
                  style={[
                    styles.bar,
                    {
                      top: ((100 - d.max!) / 100) * BAR_AREA,
                      height: Math.max(8, ((d.max! - d.min!) / 100) * BAR_AREA),
                      backgroundColor: bandColor[bandOf(d.avg)],
                    },
                  ]}
                />
              )}
            </View>
            <Text style={styles.barValue}>{d.avg === null ? '–' : formatPercent(d.avg / 100)}</Text>
            <Text style={styles.barDay}>{weekday}</Text>
          </View>
        );
      })}
    </View>
  );
}

function SummaryBox({ summary }: { summary: WeekSummary }) {
  const styles = useStyles();
  const { t } = useTranslation();
  if (summary.kind === 'lowData') {
    return (
      <View style={styles.box}>
        <Text style={styles.boxTitle}>{t('insights.week.lowData.title')}</Text>
        <Text style={styles.boxText}>
          {t('insights.week.lowData.message', { count: summary.daysMissing })}
        </Text>
      </View>
    );
  }
  const day = (d: DayStats) => ({
    day: formatWeekdayShort(d.date),
    percent: formatPercent(d.avg! / 100),
  });
  return (
    <View style={styles.box}>
      <Text style={styles.boxTitle}>
        {t(summary.trend ? `insights.week.trend.${summary.trend}` : 'insights.week.trend.noCompare')}
      </Text>
      <Text style={styles.boxText}>{t('insights.week.lowest', day(summary.lowest))}</Text>
      <Text style={styles.boxText}>{t('insights.week.highest', day(summary.highest))}</Text>
    </View>
  );
}

const useStyles = makeLegacyStyles((colors, spacing) => ({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
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
  bars: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  barColumn: { flex: 1, alignItems: 'center', gap: 4 },
  barArea: {
    width: '100%',
    height: BAR_AREA,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  bar: { position: 'absolute', left: '25%', right: '25%', borderRadius: 6 },
  barValue: { fontSize: 12, fontWeight: '600', color: colors.text },
  barDay: { fontSize: 12, color: colors.textMuted },
  box: { gap: spacing.xs, padding: spacing.md, borderRadius: 10, backgroundColor: colors.surface },
  boxTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  boxText: { fontSize: 15, color: colors.text },
}));
