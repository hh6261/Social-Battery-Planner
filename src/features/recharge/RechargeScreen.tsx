import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ScreenState } from '@/components/ScreenState';
import { createEvent, listEventTypes } from '@/db/events';
import { getInsights } from '@/db/insights';
import { addRechargeActivity, deleteRechargeActivity, listRechargeActivities } from '@/db/recharge';
import type { RechargeActivity } from '@/db/types';
import { DEFAULT_CITY } from '@/features/planner/cities';
import { RECHARGE_TYPE_KEY } from '@/features/planner/plannerLogic';
import { formatNumber } from '@/i18n/format';
import { weatherCodeToCondition } from '@/services/weatherCodes';
import { getCurrentWeather } from '@/services/weatherService';
import { makeLegacyStyles, minTouchSize, useLegacyColors } from '@/theme/legacy';

type Minutes = 15 | 30 | 60;
const MINUTE_OPTIONS: Minutes[] = [15, 30, 60];

type Suggestion = { name: string; count: number };

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; list: RechargeActivity[]; suggestions: Suggestion[] };

// A symbol, not words: the button's accessibilityLabel carries the translated text.
const REMOVE_ICON = '✕';

const WET = new Set(['rain', 'showers', 'drizzle', 'thunderstorm', 'snow']);

/**
 * Recharge Suggestions (merged screen 25, Roko's wireframe 07). Opened from Patterns
 * and from the low-battery screen (15). "Start" puts the activity in today's plan.
 */
export default function RechargeScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const [minutes, setMinutes] = useState<Minutes>(30);
  const [state, setState] = useState<State>({ status: 'loading' });
  const [reload, setReload] = useState(0);
  const [rainingNow, setRainingNow] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listRechargeActivities(), getInsights(30)])
      .then(([list, insights]) => {
        if (cancelled) return;
        const mine = new Set(list.filter((a) => a.name).map((a) => a.name!.toLocaleLowerCase()));
        // "Suggested from check-ins": activities the user rated as recharging (3.5 or more out of 5).
        const suggestions = insights.activities
          .filter((a) => a.avgImpact >= 3.5 && !mine.has(a.name.toLocaleLowerCase()))
          .map((a) => ({ name: a.name, count: a.count }));
        setState({ status: 'ready', list, suggestions });
      })
      .catch((e) => {
        if (__DEV__) console.warn('[recharge] load failed', e);
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  useFocusEffect(useCallback(() => setReload((n) => n + 1), []));

  // Current weather decides whether outdoor ideas get a "raining now" note.
  // If the weather cannot be loaded, the list simply shows without the note.
  useEffect(() => {
    let cancelled = false;
    getCurrentWeather(DEFAULT_CITY.lat, DEFAULT_CITY.lon)
      .then((w) => {
        if (!cancelled) setRainingNow(WET.has(weatherCodeToCondition(w.weatherCode)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const nameOf = (a: RechargeActivity) => (a.key ? t(`recharge.defaults.${a.key}`) : a.name ?? '');

  // One save at a time: a quick double tap must not start the same activity or add the same idea twice.
  const busy = useRef(false);
  const once = async (action: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await action();
    } finally {
      busy.current = false;
    }
  };

  const start = (a: RechargeActivity) =>
    once(async () => {
      try {
        const types = await listEventTypes();
        const quiet = types.find((x) => x.key === RECHARGE_TYPE_KEY);
        if (!quiet) return;
        const now = new Date();
        await createEvent({
          eventTypeId: quiet.id,
          title: nameOf(a),
          startsAtUtc: now.toISOString(),
          endsAtUtc: new Date(now.getTime() + a.minutes * 60_000).toISOString(),
          expectedDrain: 0,
          isOutdoor: a.isOutdoor,
        });
        setNotice(t('recharge.started', { name: nameOf(a) }));
      } catch (e) {
        if (__DEV__) console.warn('[recharge] start failed', e);
        setNotice(t('recharge.error.save'));
      }
    });

  const addSuggestion = (s: Suggestion) =>
    once(async () => {
      try {
        await addRechargeActivity({ name: s.name, minutes });
        setReload((n) => n + 1);
      } catch {
        setNotice(t('recharge.error.save'));
      }
    });

  const remove = (a: RechargeActivity) => {
    Alert.alert(t('recharge.removeConfirm.title', { name: nameOf(a) }), undefined, [
      { text: t('eventForm.deleteConfirm.cancel'), style: 'cancel' },
      {
        text: t('recharge.removeConfirm.confirm'),
        style: 'destructive',
        onPress: async () => {
          await deleteRechargeActivity(a.id).catch(() => setNotice(t('recharge.error.save')));
          setReload((n) => n + 1);
        },
      },
    ]);
  };

  if (state.status === 'loading') return <ScreenState kind="loading" />;
  if (state.status === 'error') {
    return (
      <ScreenState
        kind="error"
        title={t('recharge.error.load')}
        onAction={() => {
          setState({ status: 'loading' });
          setReload((n) => n + 1);
        }}
      />
    );
  }

  // The time chosen decides which activities show up (wireframe 07). Outdoor ideas go last when it rains.
  const fitting = state.list
    .filter((a) => a.minutes <= minutes)
    .sort((a, b) => Number(rainingNow && a.isOutdoor) - Number(rainingNow && b.isOutdoor));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.field}>
        <Text style={styles.label} nativeID="rechargeTimeLabel">
          {t('recharge.iHave')}
        </Text>
        <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabelledBy="rechargeTimeLabel">
          {MINUTE_OPTIONS.map((m) => {
            const selected = m === minutes;
            return (
              <Pressable
                key={m}
                accessibilityRole="radio"
                aria-checked={selected}
                onPress={() => setMinutes(m)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {t('planner.duration.minutes', { minutes: formatNumber(m) })}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {notice && (
        <Text style={styles.notice} accessibilityLiveRegion="polite" accessibilityRole="alert">
          {notice}
        </Text>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('recharge.myList')}
        </Text>
        {fitting.length === 0 && <Text style={styles.muted}>{t('recharge.nothingFits')}</Text>}
        {fitting.map((a) => (
          <View key={a.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>{nameOf(a)}</Text>
              <Text style={styles.muted}>
                {t('planner.duration.minutes', { minutes: formatNumber(a.minutes) })}
                {a.isOutdoor ? ` · ${t('planner.outdoors')}` : ''}
              </Text>
              {a.isOutdoor && rainingNow && <Text style={styles.rainNote}>{t('recharge.rainingNow')}</Text>}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('recharge.startLabel', { name: nameOf(a) })}
              onPress={() => start(a)}
              style={({ pressed }) => [styles.smallPrimary, pressed && styles.pressed]}
            >
              <Text style={styles.smallPrimaryText}>{t('recharge.start')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('recharge.removeLabel', { name: nameOf(a) })}
              onPress={() => remove(a)}
              style={styles.iconButton}
            >
              <Text style={styles.iconText} importantForAccessibility="no">
                {REMOVE_ICON}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('recharge.fromCheckIns')}
        </Text>
        {state.suggestions.length === 0 && <Text style={styles.muted}>{t('recharge.noSuggestions')}</Text>}
        {state.suggestions.map((s) => (
          <View key={s.name} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>{s.name}</Text>
              <Text style={styles.muted}>{t('insights.day.checkIns', { count: s.count })}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('recharge.addLabel', { name: s.name })}
              onPress={() => addSuggestion(s)}
              style={({ pressed }) => [styles.smallSecondary, pressed && styles.pressed]}
            >
              <Text style={styles.smallSecondaryText}>{t('recharge.add')}</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <AddOwn
        minutes={minutes}
        onAdded={() => setReload((n) => n + 1)}
        onError={() => setNotice(t('recharge.error.save'))}
      />
    </ScrollView>
  );
}

function AddOwn({
  minutes,
  onAdded,
  onError,
}: {
  minutes: Minutes;
  onAdded: () => void;
  onError: () => void;
}) {
  const styles = useStyles();
  const colors = useLegacyColors();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [isOutdoor, setIsOutdoor] = useState(false);
  const [missingName, setMissingName] = useState(false);
  const adding = useRef(false);

  const add = async () => {
    if (name.trim() === '') return setMissingName(true);
    if (adding.current) return;
    adding.current = true;
    try {
      await addRechargeActivity({ name, minutes, isOutdoor });
      setName('');
      setIsOutdoor(false);
      onAdded();
    } catch {
      onError();
    } finally {
      adding.current = false;
    }
  };

  return (
    <View style={[styles.section, styles.addBox]}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {t('recharge.addOwn')}
      </Text>
      <Text style={styles.label} nativeID="rechargeNameLabel">
        {t('recharge.nameLabel')}
      </Text>
      <TextInput
        value={name}
        onChangeText={(v) => {
          setName(v);
          setMissingName(false);
        }}
        maxLength={80}
        placeholder={t('recharge.namePlaceholder')}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={t('recharge.nameLabel')}
        accessibilityLabelledBy="rechargeNameLabel"
        style={styles.input}
      />
      {missingName && (
        <Text style={styles.error} accessibilityRole="alert">
          {t('recharge.error.name')}
        </Text>
      )}
      <Text style={styles.muted}>
        {t('recharge.ownMinutes', { minutes: formatNumber(minutes) })}
      </Text>
      <View style={styles.switchRow}>
        <Text style={[styles.label, styles.switchLabel]}>{t('planner.outdoors')}</Text>
        <Switch
          value={isOutdoor}
          onValueChange={setIsOutdoor}
          accessibilityLabel={t('planner.outdoors')}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={add}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
      >
        <Text style={styles.primaryButtonText}>{t('recharge.addOwnButton')}</Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeLegacyStyles((colors, spacing) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xl * 2 },
  field: { gap: spacing.sm },
  label: { fontSize: 16, fontWeight: '600', color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primarySurface, borderColor: colors.primary, borderWidth: 2 },
  chipText: { fontSize: 15, color: colors.text },
  chipTextSelected: { color: colors.primary, fontWeight: '700' },
  notice: {
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.primarySurface,
    color: colors.text,
    fontSize: 15,
  },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  rowText: { flex: 1, gap: 2 },
  rowName: { fontSize: 16, fontWeight: '600', color: colors.text },
  rainNote: { fontSize: 13, color: colors.warning },
  smallPrimary: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  smallPrimaryText: { color: colors.onPrimary, fontSize: 15, fontWeight: '700' },
  smallSecondary: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  smallSecondaryText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  iconButton: { width: minTouchSize, height: minTouchSize, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 18, color: colors.textMuted },
  addBox: { padding: spacing.md, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border },
  input: {
    minHeight: minTouchSize,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  error: { fontSize: 14, color: colors.danger, backgroundColor: colors.dangerSurface, padding: spacing.sm, borderRadius: 6 },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { flex: 1 },
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
