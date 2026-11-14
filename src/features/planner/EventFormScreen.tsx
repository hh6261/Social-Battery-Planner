import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ScreenState } from '@/components/ScreenState';
import { createEvent, deleteEvent, getEvent, listEventTypes, updateEvent } from '@/db/events';
import type { EventType, PlannedEvent } from '@/db/types';
import { formatDate, formatPercent, formatShortDay, formatTime } from '@/i18n/format';
import { colors, minTouchSize, spacing } from '@/theme/colors';

import { addDays, startOfDay } from './dates';
import { durationMinutes, formatDuration } from './plannerLogic';

const DAYS_AHEAD = 7;
const TIME_STEP = 15;
const DURATION_STEP = 30;
const MIN_DURATION = 30;
const MAX_DURATION = 12 * 60;
const DRAIN_STEP = 5;

type Loaded = { types: EventType[]; event: PlannedEvent | null };
type FieldError = 'type' | 'title' | 'past' | 'save' | null;

/** Whole days between the start of today and the start of `d` (negative for past days). */
function dayOffsetOf(d: Date, today: Date): number {
  return Math.round((startOfDay(d).getTime() - today.getTime()) / 86_400_000);
}

/**
 * Add/Edit Event (merged screen 19, Roko's wireframe 06). Without an id it creates
 * a new event; with ?id=… it edits that event and offers Delete with a confirmation (F3).
 */
export default function EventFormScreen({ eventId }: { eventId: number | null }) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listEventTypes(), eventId !== null ? getEvent(eventId) : Promise.resolve(null)])
      .then(([types, event]) => {
        if (!cancelled) setLoaded({ types, event });
      })
      .catch((e) => {
        if (__DEV__) console.warn('[event-form] load failed', e);
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, attempt]);

  const title = t(eventId === null ? 'eventForm.titleNew' : 'eventForm.titleEdit');
  // On iOS 26 the header is see-through by default and would cover the top of the screen.
  const header = <Stack.Screen options={{ title, headerTransparent: false }} />;

  if (loadFailed) {
    return (
      <>
        {header}
        <ScreenState
          kind="error"
          title={t('eventForm.error.load')}
          onAction={() => {
            setLoadFailed(false);
            setAttempt((n) => n + 1);
          }}
        />
      </>
    );
  }
  if (!loaded) {
    return (
      <>
        {header}
        <ScreenState kind="loading" />
      </>
    );
  }
  if (eventId !== null && !loaded.event) {
    return (
      <>
        {header}
        <ScreenState
          kind="empty"
          title={t('eventForm.error.notFound')}
          onAction={() => router.back()}
          actionLabel={t('eventForm.back')}
        />
      </>
    );
  }

  return (
    <>
      {header}
      <EventForm types={loaded.types} existing={loaded.event} />
    </>
  );
}

function EventForm({ types, existing }: { types: EventType[]; existing: PlannedEvent | null }) {
  const { t } = useTranslation();
  const today = useMemo(() => startOfDay(new Date()), []);

  const initial = useMemo(() => {
    if (existing) {
      const start = new Date(existing.startsAtUtc);
      return {
        typeId: existing.eventTypeId as number | null,
        dayOffset: dayOffsetOf(start, today),
        minutes: start.getHours() * 60 + start.getMinutes(),
        duration: Math.max(MIN_DURATION, durationMinutes(existing) ?? 60),
        drain: existing.expectedDrain ?? 0,
      };
    }
    const nextHour = new Date().getHours() + 1;
    return {
      typeId: null as number | null,
      dayOffset: nextHour >= 24 ? 1 : 0,
      minutes: nextHour >= 24 ? 9 * 60 : nextHour * 60,
      duration: 60,
      drain: 0,
    };
  }, [existing, today]);

  const [typeId, setTypeId] = useState<number | null>(initial.typeId);
  const [name, setName] = useState(existing?.title ?? '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [dayOffset, setDayOffset] = useState(initial.dayOffset);
  const [minutes, setMinutes] = useState(initial.minutes);
  const [duration, setDuration] = useState(initial.duration);
  const [isOutdoor, setIsOutdoor] = useState(existing?.isOutdoor ?? false);
  const [drain, setDrain] = useState(initial.drain);
  const [drainTouched, setDrainTouched] = useState(existing !== null);
  const [error, setError] = useState<FieldError>(null);
  const [saving, setSaving] = useState(false);

  // Days to pick from: the next 7, plus the event's own day if it lies outside them.
  const dayOffsets = useMemo(() => {
    const list = Array.from({ length: DAYS_AHEAD }, (_, i) => i);
    if (!list.includes(initial.dayOffset)) list.unshift(initial.dayOffset);
    return list;
  }, [initial.dayOffset]);

  const startsAt = useMemo(() => {
    const day = addDays(today, dayOffset);
    return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes);
  }, [today, dayOffset, minutes]);

  const pickType = (type: EventType) => {
    setTypeId(type.id);
    // A new event starts with the type's usual drain until the user changes it.
    if (!drainTouched) setDrain(type.defaultDrain);
    if (error === 'type') setError(null);
  };

  const dayLabel = (offset: number) => {
    if (offset === 0) return t('eventForm.today');
    if (offset === 1) return t('eventForm.tomorrow');
    const d = addDays(today, offset);
    return offset > 0 && offset < DAYS_AHEAD ? formatShortDay(d) : formatDate(d);
  };

  const save = async () => {
    if (typeId === null) return setError('type');
    if (name.trim() === '') return setError('title');
    if (!existing && startsAt.getTime() < Date.now()) return setError('past');
    setError(null);
    setSaving(true);
    const input = {
      eventTypeId: typeId,
      title: name,
      location: location.trim() === '' ? null : location,
      startsAtUtc: startsAt.toISOString(),
      endsAtUtc: new Date(startsAt.getTime() + duration * 60_000).toISOString(),
      expectedDrain: drain,
      isOutdoor,
    };
    try {
      if (existing) await updateEvent(existing.id, input);
      else await createEvent(input);
      router.back();
    } catch (e) {
      if (__DEV__) console.warn('[event-form] save failed', e);
      setError('save');
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert(t('eventForm.deleteConfirm.title'), t('eventForm.deleteConfirm.message'), [
      { text: t('eventForm.deleteConfirm.cancel'), style: 'cancel' },
      {
        text: t('eventForm.deleteConfirm.confirm'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEvent(existing.id);
            router.back();
          } catch (e) {
            if (__DEV__) console.warn('[event-form] delete failed', e);
            setError('save');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Type */}
      <View style={styles.field}>
        <Text style={styles.label} nativeID="eventTypeLabel">
          {t('eventForm.type')}
        </Text>
        <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabelledBy="eventTypeLabel">
          {types.map((type) => {
            const selected = typeId === type.id;
            return (
              <Pressable
                key={type.id}
                accessibilityRole="radio"
                aria-checked={selected}
                onPress={() => pickType(type)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {t(`eventType.${type.key}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {error === 'type' && <ErrorText text={t('eventForm.error.type')} />}
      </View>

      {/* Title and place */}
      <View style={styles.field}>
        <Text style={styles.label} nativeID="eventTitleLabel">
          {t('eventForm.name')}
        </Text>
        <TextInput
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (error === 'title') setError(null);
          }}
          maxLength={120}
          placeholder={t('eventForm.namePlaceholder')}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t('eventForm.name')}
          accessibilityLabelledBy="eventTitleLabel"
          style={styles.input}
        />
        {error === 'title' && <ErrorText text={t('eventForm.error.title')} />}
      </View>

      <View style={styles.field}>
        <Text style={styles.label} nativeID="eventLocationLabel">
          {t('eventForm.location')}
        </Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          maxLength={120}
          placeholder={t('eventForm.locationPlaceholder')}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t('eventForm.location')}
          accessibilityLabelledBy="eventLocationLabel"
          style={styles.input}
        />
      </View>

      {/* Day */}
      <View style={styles.field}>
        <Text style={styles.label} nativeID="eventDayLabel">
          {t('eventForm.day')}
        </Text>
        <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabelledBy="eventDayLabel">
          {dayOffsets.map((offset) => {
            const selected = dayOffset === offset;
            return (
              <Pressable
                key={offset}
                accessibilityRole="radio"
                aria-checked={selected}
                onPress={() => {
                  setDayOffset(offset);
                  if (error === 'past') setError(null);
                }}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {dayLabel(offset)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Time, duration and drain */}
      <Stepper
        label={t('eventForm.time')}
        value={formatTime(startsAt)}
        decreaseLabel={t('eventForm.earlier', { minutes: TIME_STEP })}
        increaseLabel={t('eventForm.later', { minutes: TIME_STEP })}
        onDecrease={() => {
          setMinutes((m) => Math.max(0, m - TIME_STEP));
          if (error === 'past') setError(null);
        }}
        onIncrease={() => {
          setMinutes((m) => Math.min(24 * 60 - TIME_STEP, m + TIME_STEP));
          if (error === 'past') setError(null);
        }}
      />
      {error === 'past' && <ErrorText text={t('eventForm.error.past')} />}

      <Stepper
        label={t('eventForm.duration')}
        value={formatDuration(t, duration)}
        decreaseLabel={t('eventForm.shorter', { minutes: DURATION_STEP })}
        increaseLabel={t('eventForm.longer', { minutes: DURATION_STEP })}
        onDecrease={() => setDuration((d) => Math.max(MIN_DURATION, d - DURATION_STEP))}
        onIncrease={() => setDuration((d) => Math.min(MAX_DURATION, d + DURATION_STEP))}
      />

      <Stepper
        label={t('eventForm.drain')}
        value={formatPercent(drain / 100)}
        decreaseLabel={t('eventForm.lessDrain')}
        increaseLabel={t('eventForm.moreDrain')}
        onDecrease={() => {
          setDrainTouched(true);
          setDrain((d) => Math.max(0, d - DRAIN_STEP));
        }}
        onIncrease={() => {
          setDrainTouched(true);
          setDrain((d) => Math.min(100, d + DRAIN_STEP));
        }}
      />
      <Text style={styles.help}>{t('eventForm.drainHelp')}</Text>

      {/* Outdoors: used with the forecast on Plan Ahead */}
      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.label}>{t('eventForm.outdoors')}</Text>
          <Text style={styles.help}>{t('eventForm.outdoorsHelp')}</Text>
        </View>
        <Switch
          value={isOutdoor}
          onValueChange={setIsOutdoor}
          accessibilityLabel={t('eventForm.outdoors')}
          accessibilityHint={t('eventForm.outdoorsHelp')}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>

      {error === 'save' && <ErrorText text={t('eventForm.error.save')} />}

      <Pressable
        accessibilityRole="button"
        aria-disabled={saving}
        aria-busy={saving}
        disabled={saving}
        onPress={save}
        style={({ pressed }) => [styles.saveButton, (pressed || saving) && styles.pressed]}
      >
        <Text style={styles.saveText}>{saving ? t('eventForm.saving') : t('eventForm.save')}</Text>
      </Pressable>

      {existing && (
        <Pressable
          accessibilityRole="button"
          onPress={confirmDelete}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
        >
          <Text style={styles.deleteText}>{t('eventForm.delete')}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function ErrorText({ text }: { text: string }) {
  return (
    <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      {text}
    </Text>
  );
}

function Stepper(props: {
  label: string;
  value: string;
  decreaseLabel: string;
  increaseLabel: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.stepperRow}>
      <Text style={[styles.label, styles.stepperLabel]}>{props.label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={props.decreaseLabel}
        onPress={props.onDecrease}
        style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
      >
        <Text style={styles.stepButtonText} importantForAccessibility="no">
          −
        </Text>
      </Pressable>
      <Text
        style={styles.stepValue}
        accessibilityLabel={t('eventForm.labelValue', { label: props.label, value: props.value })}
        accessibilityLiveRegion="polite"
      >
        {props.value}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={props.increaseLabel}
        onPress={props.onIncrease}
        style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
      >
        <Text style={styles.stepButtonText} importantForAccessibility="no">
          +
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xl * 2 },
  field: { gap: spacing.sm },
  label: { fontSize: 16, fontWeight: '600', color: colors.text },
  help: { fontSize: 14, color: colors.textMuted },
  input: {
    minHeight: minTouchSize,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
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
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  stepperLabel: { flexGrow: 1, flexBasis: 100 },
  stepButton: {
    width: minTouchSize,
    height: minTouchSize,
    borderRadius: minTouchSize / 2,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: { fontSize: 22, color: colors.primary, fontWeight: '600' },
  stepValue: { minWidth: 64, textAlign: 'center', fontSize: 17, fontWeight: '600', color: colors.text },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchText: { flex: 1, gap: 2 },
  error: {
    fontSize: 14,
    color: colors.danger,
    backgroundColor: colors.dangerSurface,
    padding: spacing.sm,
    borderRadius: 6,
  },
  saveButton: {
    minHeight: minTouchSize + 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  saveText: { color: colors.onPrimary, fontSize: 17, fontWeight: '700' },
  deleteButton: {
    minHeight: minTouchSize,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.8 },
});
