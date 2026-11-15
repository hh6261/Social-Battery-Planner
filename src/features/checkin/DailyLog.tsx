import { Feather } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HardShadow } from '@/components/HardShadow';
import { listCheckInsBefore, listCheckInsByDay } from '@/db/checkIns';
import { localDayRangeUtc } from '@/db/time';
import type { CheckIn } from '@/db/types';
import { formatDate, formatNumber, formatPercent, formatTime } from '@/i18n/format';
import { weatherCodeToCondition } from '@/services/weatherCodes';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import BatteryIcon from './BatteryIcon';

type Data = { today: CheckIn[]; previous: CheckIn[] };

async function loadData(): Promise<Data> {
  const now = new Date();
  const [today, previous] = await Promise.all([
    listCheckInsByDay(now),
    listCheckInsBefore(localDayRangeUtc(now).startUtc, 30),
  ]);
  return { today: [...today].reverse(), previous }; // newest first
}

function Row({ item, showTime }: { item: CheckIn; showTime: boolean }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const date = new Date(item.createdAtUtc);
  const when = showTime ? formatTime(date) : formatDate(date);
  const percent = formatPercent(item.batteryLevel / 100);
  const weather =
    item.weatherCode !== null && item.weatherTemp !== null
      ? t('checkin.log.weather', {
          condition: t(`weather.condition.${weatherCodeToCondition(item.weatherCode)}`),
          temperature: formatNumber(item.weatherTemp),
        })
      : null;

  return (
    <View style={styles.row}>
      <AppText variant="label" style={styles.rowDate}>
        {when}
      </AppText>
      <BatteryIcon level={item.batteryLevel} size="small" />
      <View style={styles.rowActivity}>
        <AppText variant="bodySmall" color="muted" numberOfLines={1}>
          {item.activity ?? ''}
        </AppText>
        {weather ? (
          <AppText variant="caption" color="muted" numberOfLines={1}>
            {weather}
          </AppText>
        ) : null}
      </View>
      <Pressable
        hitSlop={4}
        style={({ pressed }) => [styles.pencil, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={t('checkin.log.rowOptions', { date: when, percent })}
        onPress={() => router.push({ pathname: '/checkin-options', params: { id: String(item.id) } } as Href)}
      >
        <Feather name="edit-2" size={18} color={theme.colors.ink} />
      </Pressable>
    </View>
  );
}

/** Screen 16, the Log half of the Tracker tab. Reloads every time it comes into view. */
export default function DailyLog() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    loadData()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(false);
      })
      .catch((e) => {
        console.error('Loading the daily log failed', e);
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useFocusEffect(load);

  if (error) {
    return (
      <View style={styles.center}>
        <AppText accessibilityRole="alert" align="center">
          {t('checkin.log.error')}
        </AppText>
        <Button variant="outline" size="md" label={t('checkin.retry')} onPress={() => load()} />
      </View>
    );
  }
  if (data === null) {
    return (
      <View style={styles.center}>
        <AppText color="muted" accessibilityLiveRegion="polite">
          {t('app.loading')}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {data.today.length === 0 ? (
        <AppText variant="heading" align="center" accessibilityRole="header" style={styles.empty}>
          {t('checkin.log.emptyToday')}
        </AppText>
      ) : (
        <Card flush style={styles.section}>
          <AppText variant="eyebrow" accessibilityRole="header" style={styles.cardTitle}>
            {t('checkin.log.today')}
          </AppText>
          {data.today.map((c) => (
            <Row key={c.id} item={c} showTime />
          ))}
        </Card>
      )}

      {/* Big and central, so it is easy to reach and hard to miss */}
      <View style={styles.plusWrap}>
        <HardShadow radius={48}>
          <Pressable
            onPress={() => router.push('/checkin/battery')}
            accessibilityRole="button"
            accessibilityLabel={t('checkin.log.add')}
            style={({ pressed }) => [styles.plus, pressed && styles.pressed]}
          >
            <Feather name="plus" size={48} color={theme.colors.ink} />
          </Pressable>
        </HardShadow>
      </View>

      <Card flush style={styles.section}>
        <AppText variant="eyebrow" accessibilityRole="header" style={styles.cardTitle}>
          {t('checkin.log.previous')}
        </AppText>
        {data.previous.length === 0 ? (
          <AppText variant="bodySmall" color="muted" style={styles.none}>
            {t('checkin.log.noPrevious')}
          </AppText>
        ) : (
          data.previous.map((c) => <Row key={c.id} item={c} showTime={false} />)
        )}
      </Card>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing.xl },
  center: { padding: t.spacing.xl, gap: t.spacing.md, alignItems: 'center' },
  empty: { marginTop: t.spacing.lg },
  section: { marginBottom: t.spacing.xs },
  cardTitle: { paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.lg, paddingBottom: t.spacing.xs },
  none: { paddingHorizontal: t.spacing.lg, paddingBottom: t.spacing.lg },
  plusWrap: { alignItems: 'center' },
  plus: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: t.borderWidth + 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    minHeight: 56,
    paddingHorizontal: t.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: t.colors.line,
  },
  rowDate: { minWidth: 72 },
  rowActivity: { flex: 1 },
  pencil: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
}));
