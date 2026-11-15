import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ScreenState } from '@/components/ScreenState';
import { getInsights, type InsightsData } from '@/db/insights';
import { makeLegacyStyles, minTouchSize, useLegacyColors } from '@/theme/legacy';

import {
  MIN_RATED_FOR_PATTERNS,
  splitByBattery,
  splitByImpact,
  type PatternItem,
} from './insightsLogic';

type Filter = 'who' | 'activity' | 'time';
const FILTERS: Filter[] = ['who', 'activity', 'time'];
const SHOW_FIRST = 3;
const DAYS = 30;

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: InsightsData };

/** Patterns: Drains and Recharges (merged screen 22, Roko's wireframe 03). Based on the last 30 days. */
export default function PatternsView() {
  const styles = useStyles();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>('activity');
  const [state, setState] = useState<State>({ status: 'loading' });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getInsights(DAYS)
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data });
      })
      .catch((e) => {
        if (__DEV__) console.warn('[insights] patterns failed', e);
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  useFocusEffect(useCallback(() => setReload((n) => n + 1), []));

  if (state.status === 'loading') return <ScreenState kind="loading" />;
  if (state.status === 'error') {
    return (
      <ScreenState
        kind="error"
        title={t('insights.loadError')}
        onAction={() => {
          setState({ status: 'loading' });
          setReload((n) => n + 1);
        }}
      />
    );
  }

  const { data } = state;
  const rated = data.activities.reduce((n, a) => n + a.count, 0);
  const split =
    filter === 'time'
      ? splitByBattery(data.timeOfDay)
      : splitByImpact(filter === 'who' ? data.people : data.activities);
  const label = (key: string) =>
    filter === 'time' ? t(`patterns.bucket.${key}`) : key; // names are the user's own text

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.muted}>{t('patterns.period', { count: DAYS })}</Text>

      <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabel={t('patterns.filterLabel')}>
        {FILTERS.map((f) => {
          const selected = f === filter;
          return (
            <Pressable
              key={f}
              accessibilityRole="radio"
              aria-checked={selected}
              onPress={() => setFilter(f)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {t(`patterns.filter.${f}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {rated < MIN_RATED_FOR_PATTERNS && filter !== 'time' ? (
        <View style={styles.box}>
          <Text style={styles.boxTitle}>{t('insights.week.lowData.title')}</Text>
          <Text style={styles.boxText}>
            {t('patterns.lowData', { count: MIN_RATED_FOR_PATTERNS - rated })}
          </Text>
        </View>
      ) : (
        <>
          <PatternList
            title={t(filter === 'time' ? 'patterns.lowTimes' : 'patterns.drains')}
            items={split.drains}
            kind="drain"
            label={label}
          />
          <PatternList
            title={t(filter === 'time' ? 'patterns.highTimes' : 'patterns.recharges')}
            items={split.recharges}
            kind="recharge"
            label={label}
          />
        </>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/recharge' as Href)}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
      >
        <Text style={styles.primaryButtonText}>{t('patterns.toRecharge')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function PatternList({
  title,
  items,
  kind,
  label,
}: {
  title: string;
  items: PatternItem[];
  kind: 'drain' | 'recharge';
  label: (key: string) => string;
}) {
  const styles = useStyles();
  const colors = useLegacyColors();
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, SHOW_FIRST);
  const dotColor = kind === 'drain' ? colors.danger : colors.success;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {items.length === 0 && <Text style={styles.muted}>{t('patterns.none')}</Text>}
      {visible.map((item) => {
        const strength = t(`patterns.strength.${item.strength}`);
        const count = t('insights.day.checkIns', { count: item.count });
        return (
          <View
            key={item.key}
            style={styles.row}
            accessible
            accessibilityLabel={t('patterns.itemLabel', { name: label(item.key), strength, count })}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowName}>{label(item.key)}</Text>
              <Text style={styles.muted}>{count}</Text>
            </View>
            {/* Dots show strength; the word next to them says the same for anyone who cannot see colour. */}
            <View style={styles.dots}>
              {[1, 2, 3].map((n) => (
                <View
                  key={n}
                  style={[styles.dot, { borderColor: dotColor }, n <= item.strength && { backgroundColor: dotColor }]}
                />
              ))}
            </View>
            <Text style={styles.strength}>{strength}</Text>
          </View>
        );
      })}
      {items.length > SHOW_FIRST && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowAll((s) => !s)}
          style={styles.moreButton}
        >
          <Text style={styles.moreText}>
            {showAll ? t('patterns.less') : t('patterns.more', { count: items.length - SHOW_FIRST })}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const useStyles = makeLegacyStyles((colors, spacing) => ({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
  muted: { fontSize: 14, color: colors.textMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primarySurface, borderColor: colors.primary, borderWidth: 2 },
  chipText: { fontSize: 15, color: colors.text },
  chipTextSelected: { color: colors.primary, fontWeight: '700' },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  rowText: { flex: 1, gap: 2 },
  rowName: { fontSize: 16, fontWeight: '600', color: colors.text },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  strength: { fontSize: 13, color: colors.textMuted, minWidth: 56 },
  moreButton: { minHeight: minTouchSize, justifyContent: 'center', alignSelf: 'flex-start' },
  moreText: { fontSize: 15, color: colors.primary, fontWeight: '600', textDecorationLine: 'underline' },
  box: { gap: spacing.xs, padding: spacing.md, borderRadius: 10, backgroundColor: colors.surface },
  boxTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  boxText: { fontSize: 15, color: colors.text },
  primaryButton: {
    minHeight: minTouchSize + 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  primaryButtonText: { color: colors.onPrimary, fontSize: 17, fontWeight: '700' },
  pressed: { opacity: 0.8 },
}));
