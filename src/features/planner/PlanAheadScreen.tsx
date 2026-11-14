import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ScreenState } from '@/components/ScreenState';
import { createEvent, listEventTypes, listEventsInRange } from '@/db/events';
import type { PlannedEvent } from '@/db/types';
import { formatDayHeading, formatNumber, formatPercent, formatTime } from '@/i18n/format';
import { weatherCodeToCondition } from '@/services/weatherCodes';
import {
  getDailyForecast,
  WeatherError,
  type DailyForecast,
  type WeatherErrorKind,
} from '@/services/weatherService';
import { colors, minTouchSize, spacing } from '@/theme/colors';

import { CITIES, DEFAULT_CITY, type City } from './cities';
import { addDays, startOfDay } from './dates';
import {
  durationMinutes,
  formatDuration,
  groupByDay,
  isWetDay,
  needsRecharge,
  RECHARGE_MINUTES,
  RECHARGE_TYPE_KEY,
  rechargeStart,
} from './plannerLogic';

const DAYS = 7;
const ATTRIBUTION_URL = 'https://open-meteo.com/';

type EventsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; events: PlannedEvent[] };

type ForecastState =
  | { status: 'loading' }
  | { status: 'error'; kind: WeatherErrorKind }
  | { status: 'ready'; days: DailyForecast[] };

/**
 * Plan Ahead (merged screen 18, Roko's wireframe 05): events for the next 7 days,
 * how much each one drains, and the forecast for each day. Outdoor events on a wet
 * day get a warning: this is where the weather API data is actually used (F4).
 */
export default function PlanAheadScreen() {
  const { t } = useTranslation();
  const [eventsState, setEventsState] = useState<EventsState>({ status: 'loading' });
  const [city, setCity] = useState<City>(DEFAULT_CITY);
  const [forecast, setForecast] = useState<{ cityId: string; state: ForecastState } | null>(null);
  const [attempt, setAttempt] = useState(0); // goes up when the user taps "Try again"

  const loadEvents = useCallback(async () => {
    try {
      const today = startOfDay(new Date());
      const events = await listEventsInRange(today, addDays(today, DAYS));
      setEventsState({ status: 'ready', events });
    } catch (e) {
      if (__DEV__) console.warn('[planner] could not load events', e);
      setEventsState({ status: 'error' });
    }
  }, []);

  // Reload whenever the screen comes back into view, e.g. after saving an event.
  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents]),
  );

  // The forecast is stored together with its city, so switching city shows "loading"
  // until that city's answer arrives.
  useEffect(() => {
    let cancelled = false;
    getDailyForecast(city.lat, city.lon, DAYS, { forceRefresh: attempt > 0 })
      .then((days) => {
        if (!cancelled) setForecast({ cityId: city.id, state: { status: 'ready', days } });
      })
      .catch((error) => {
        const kind: WeatherErrorKind = error instanceof WeatherError ? error.kind : 'malformed';
        if (!cancelled) setForecast({ cityId: city.id, state: { status: 'error', kind } });
      });
    return () => {
      cancelled = true;
    };
  }, [city, attempt]);

  const forecastState = useMemo<ForecastState>(
    () => (forecast?.cityId === city.id ? forecast.state : { status: 'loading' }),
    [forecast, city.id],
  );

  const forecastByDay = useMemo(() => {
    const map = new Map<string, DailyForecast>();
    if (forecastState.status === 'ready') forecastState.days.forEach((d) => map.set(d.date, d));
    return map;
  }, [forecastState]);

  const retryForecast = () => {
    setForecast(null);
    setAttempt((n) => n + 1);
  };

  // A quick second tap would otherwise add the same quiet time twice before the list reloads.
  const addingQuietTime = useRef(false);
  const addQuietTime = async (dayEvents: PlannedEvent[]) => {
    if (addingQuietTime.current) return;
    addingQuietTime.current = true;
    try {
      const types = await listEventTypes();
      const quiet = types.find((x) => x.key === RECHARGE_TYPE_KEY);
      if (!quiet) return;
      const start = rechargeStart(dayEvents);
      await createEvent({
        eventTypeId: quiet.id,
        title: t('planner.quickAdd.eventTitle'),
        startsAtUtc: start.toISOString(),
        endsAtUtc: new Date(start.getTime() + RECHARGE_MINUTES * 60_000).toISOString(),
        expectedDrain: 0,
      });
      await loadEvents();
    } catch (e) {
      if (__DEV__) console.warn('[planner] quick add failed', e);
      setEventsState({ status: 'error' });
    } finally {
      addingQuietTime.current = false;
    }
  };

  const openNewEvent = () => router.push('/planner/event' as Href);
  const openEvent = (id: number) =>
    router.push({ pathname: '/planner/event', params: { id: String(id) } } as Href);

  if (eventsState.status === 'loading') return <ScreenState kind="loading" />;
  if (eventsState.status === 'error') {
    return <ScreenState kind="error" title={t('planner.loadError')} onAction={loadEvents} />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <CityPicker city={city} onChange={setCity} />
        <ForecastNotice state={forecastState} onRetry={retryForecast} />

        {eventsState.events.length === 0 ? (
          <View style={styles.emptyBox}>
            <ScreenState
              kind="empty"
              title={t('planner.empty.title')}
              message={t('planner.empty.message')}
            />
          </View>
        ) : (
          groupByDay(eventsState.events).map(([dayKey, dayEvents]) => (
            <DaySection
              key={dayKey}
              events={dayEvents}
              forecast={forecastByDay.get(dayKey)}
              onOpen={openEvent}
              onAddQuietTime={() => addQuietTime(dayEvents)}
            />
          ))
        )}

        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(ATTRIBUTION_URL)}
          style={styles.attribution}
        >
          <Text style={styles.attributionText}>{t('weather.attribution')}</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={openNewEvent}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>{t('planner.add')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CityPicker({ city, onChange }: { city: City; onChange: (c: City) => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.cityBlock}>
      <Text style={styles.cityLabel} nativeID="plannerCityLabel">
        {t('planner.forecastFor')}
      </Text>
      <View
        style={styles.chipRow}
        accessibilityRole="radiogroup"
        accessibilityLabelledBy="plannerCityLabel"
      >
        {CITIES.map((c) => {
          const selected = c.id === city.id;
          return (
            <Pressable
              key={c.id}
              accessibilityRole="radio"
              aria-checked={selected}
              onPress={() => onChange(c)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{c.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ForecastNotice({ state, onRetry }: { state: ForecastState; onRetry: () => void }) {
  const { t } = useTranslation();
  if (state.status === 'loading') {
    return (
      <Text style={styles.muted} accessibilityLiveRegion="polite">
        {t('weather.loading')}
      </Text>
    );
  }
  if (state.status === 'ready') return null;
  // The events still show; only the forecast is missing.
  return (
    <View style={styles.notice} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <Text style={styles.noticeTitle}>{t(`weather.error.${state.kind}`)}</Text>
      <Text style={styles.noticeText}>{t('planner.noForecast')}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
      >
        <Text style={styles.secondaryButtonText}>{t('weather.retry')}</Text>
      </Pressable>
    </View>
  );
}

function DaySection({
  events,
  forecast,
  onOpen,
  onAddQuietTime,
}: {
  events: PlannedEvent[];
  forecast?: DailyForecast;
  onOpen: (id: number) => void;
  onAddQuietTime: () => void;
}) {
  const { t } = useTranslation();
  const wet = forecast ? isWetDay(forecast) : false;

  return (
    <View style={styles.day}>
      <Text style={styles.dayHeading} accessibilityRole="header">
        {formatDayHeading(new Date(events[0].startsAtUtc))}
      </Text>
      <Text style={styles.muted}>{t('event.count', { count: events.length })}</Text>
      {forecast && (
        <Text style={styles.muted}>
          {forecast.rainChance === null
            ? t('planner.forecast', {
                condition: t(`weather.condition.${weatherCodeToCondition(forecast.weatherCode)}`),
                temp: formatNumber(Math.round(forecast.tempMax) || 0),
              })
            : t('planner.forecastWithRain', {
                condition: t(`weather.condition.${weatherCodeToCondition(forecast.weatherCode)}`),
                temp: formatNumber(Math.round(forecast.tempMax) || 0),
                rain: formatPercent(forecast.rainChance / 100),
              })}
        </Text>
      )}

      {events.map((e) => (
        <View key={e.id}>
          <EventRow event={e} onPress={() => onOpen(e.id)} />
          {e.isOutdoor && wet && <Text style={styles.rainHint}>{t('planner.rainHint')}</Text>}
        </View>
      ))}

      {needsRecharge(events) && (
        <View style={styles.quickAdd}>
          <Text style={styles.quickAddText}>
            {t('planner.quickAdd.question', { minutes: RECHARGE_MINUTES })}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityHint={t('planner.quickAdd.hint')}
            onPress={onAddQuietTime}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>{t('planner.quickAdd.add')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function EventRow({ event, onPress }: { event: PlannedEvent; onPress: () => void }) {
  const { t } = useTranslation();
  const time = formatTime(new Date(event.startsAtUtc));
  const type = t(`eventType.${event.typeKey}`);
  const minutes = durationMinutes(event);
  const duration = minutes !== null && minutes > 0 ? formatDuration(t, minutes) : null;
  const drain =
    event.expectedDrain !== null && event.expectedDrain > 0
      ? t('planner.drains', { percent: formatPercent(event.expectedDrain / 100) })
      : null;
  const details = [type, duration, event.location, event.isOutdoor ? t('planner.outdoors') : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={t('planner.openHint')}
      accessibilityLabel={[time, event.title, details, drain].filter(Boolean).join(', ')}
      onPress={onPress}
      style={({ pressed }) => [
        styles.event,
        event.typeKey === RECHARGE_TYPE_KEY && styles.eventQuiet,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.eventMain}>
        <Text style={styles.eventTime}>{time}</Text>
        <View style={styles.eventBody}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.muted}>{details}</Text>
        </View>
      </View>
      {/* Arrow + words, so the meaning never depends on the red colour alone. */}
      {drain && <Text style={styles.drain}>↘ {drain}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
  emptyBox: { minHeight: 240 },
  cityBlock: { gap: spacing.sm },
  cityLabel: { fontSize: 14, color: colors.textMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipSelected: { backgroundColor: colors.primarySurface, borderColor: colors.primary, borderWidth: 2 },
  chipText: { fontSize: 15, color: colors.text },
  chipTextSelected: { color: colors.primary, fontWeight: '700' },
  muted: { fontSize: 14, color: colors.textMuted },
  notice: { gap: spacing.sm, padding: spacing.md, borderRadius: 8, backgroundColor: colors.warningSurface },
  noticeTitle: { fontSize: 15, fontWeight: '700', color: colors.warning },
  noticeText: { fontSize: 14, color: colors.text },
  day: { gap: spacing.sm },
  dayHeading: { fontSize: 20, fontWeight: '700', color: colors.text },
  event: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  eventQuiet: { borderStyle: 'dashed' },
  eventMain: { flexDirection: 'row', gap: spacing.md },
  eventTime: { fontSize: 16, fontWeight: '700', color: colors.text, minWidth: 52 },
  eventBody: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  drain: { fontSize: 14, fontWeight: '600', color: colors.danger },
  rainHint: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: 6,
    backgroundColor: colors.warningSurface,
    color: colors.warning,
    fontSize: 14,
  },
  quickAdd: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  quickAddText: { flexShrink: 1, fontSize: 15, color: colors.text },
  attribution: { minHeight: minTouchSize, justifyContent: 'center', alignSelf: 'flex-start' },
  attributionText: { fontSize: 13, color: colors.primary, textDecorationLine: 'underline' },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.track },
  primaryButton: {
    minHeight: minTouchSize + 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  primaryButtonText: { color: colors.onPrimary, fontSize: 17, fontWeight: '700' },
  secondaryButton: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  secondaryButtonText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  pressed: { opacity: 0.8 },
});
