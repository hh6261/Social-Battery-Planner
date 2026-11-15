import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useDialog } from '@/components/DialogProvider';
import { Screen } from '@/components/Screen';
import { createCheckIn, getCheckIn, updateCheckIn } from '@/db/checkIns';
import BackButton from '@/features/checkin/BackButton';
import BatteryIcon from '@/features/checkin/BatteryIcon';
import { useCheckInDraft } from '@/features/checkin/CheckInDraft';
import { LOW_BATTERY_MAX } from '@/features/checkin/constants';
import { useCheckInNav } from '@/features/checkin/navigation';
import { useCheckInWeather } from '@/features/checkin/useCheckInWeather';
import { weatherCodeToCondition } from '@/services/weatherCodes';
import { formatList, formatNumber } from '@/i18n/format';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';

type RowProps = { label: string; value: string; muted: boolean; hint: string; onPress: () => void };

function SummaryRow({ label, value, muted, hint, onPress }: RowProps) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityHint={hint}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowText}>
        <AppText variant="eyebrow">{label}</AppText>
        <AppText variant="body" color={muted ? 'muted' : 'ink'}>
          {value}
        </AppText>
      </View>
      <Feather name="chevron-right" size={22} color={theme.colors.detail} />
    </Pressable>
  );
}

/**
 * Screen 14. Used for a new check-in (after the notes step) and for editing a saved one
 * (opened with ?editId=12 from the edit/delete dialog, screen 17).
 */
export default function ConfirmStep() {
  const { t } = useTranslation();
  const styles = useStyles();
  const theme = useTheme();
  const { showDialog } = useDialog();
  const { leave, finishNew } = useCheckInNav();
  const { draft, editingId, startEdit } = useCheckInDraft();
  const params = useLocalSearchParams<{ editId?: string }>();
  const editId = params.editId !== undefined && Number.isInteger(Number(params.editId)) ? Number(params.editId) : null;

  // When editing, the saved check-in is loaded into the draft once, when this screen opens.
  const [load, setLoad] = useState<'loading' | 'ready' | 'missing'>(
    editId !== null && editingId === null ? 'loading' : 'ready'
  );
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(false);
  const editing = editingId !== null;

  useEffect(() => {
    if (load !== 'loading' || editId === null) return;
    let cancelled = false;
    getCheckIn(editId)
      .then((c) => {
        if (cancelled) return;
        if (c) {
          startEdit(c);
          setLoad('ready');
        } else {
          setLoad('missing');
        }
      })
      .catch(() => {
        if (!cancelled) setLoad('missing');
      });
    return () => {
      cancelled = true;
    };
  }, [load, editId, startEdit]);

  // New check-ins record the weather automatically; edited ones keep the weather they were saved with.
  const liveWeather = useCheckInWeather(!editing);

  // Finished (saved or discarded): render nothing while the screen is being closed.
  if (done) return null;

  if (load === 'loading') {
    return (
      <Screen>
        <AppText accessibilityLiveRegion="polite">{t('app.loading')}</AppText>
      </Screen>
    );
  }

  // Missing check-in (deleted meanwhile) or opened without a battery level.
  if (load === 'missing' || draft.batteryLevel === null) {
    return (
      <Screen>
        <BackButton onPress={leave} />
        <AppText variant="heading" style={styles.missing} accessibilityRole="header">
          {t(load === 'missing' ? 'checkin.confirm.notFound' : 'checkin.confirm.missing')}
        </AppText>
        {load !== 'missing' && (
          <Button label={t('checkin.confirm.goBattery')} onPress={() => router.replace('/checkin/battery')} />
        )}
      </Screen>
    );
  }

  const level = draft.batteryLevel;
  const moodText = draft.moods.length
    ? formatList(draft.moods.map((key) => t(`checkin.mood.options.${key}`, { defaultValue: key })))
    : t('checkin.confirm.none');
  const activityText = draft.activity.trim() || t('checkin.confirm.none');
  const noteText =
    [draft.noteTitle.trim(), draft.notes.trim()].filter(Boolean).join('\n') || t('checkin.confirm.noNote');
  const hint = t('checkin.confirm.editHint');

  const saved =
    editing && draft.weatherCode !== null && draft.weatherTemp !== null
      ? { code: draft.weatherCode, temperature: draft.weatherTemp, city: draft.weatherCity ?? '' }
      : null;
  const weather = editing ? saved : liveWeather.status === 'ready' ? liveWeather.weather : null;
  let weatherText = t('checkin.confirm.weatherNone');
  if (weather) {
    weatherText = t('checkin.confirm.weatherValue', {
      condition: t(`weather.condition.${weatherCodeToCondition(weather.code)}`),
      temperature: formatNumber(weather.temperature),
      city: weather.city,
    });
  } else if (!editing && liveWeather.status === 'loading') {
    weatherText = t('weather.loading');
  }

  const save = async () => {
    if (saving) return; // ignore double taps
    setSaving(true);
    setFailed(false);
    try {
      const input = {
        batteryLevel: level,
        moods: draft.moods,
        activity: draft.activity.trim() || null,
        groupSize: draft.groupSize,
        oneOnOne: draft.oneOnOne,
        strangerCount: draft.strangerCount,
        friendsMade: draft.friendsMade,
        energyChange: draft.energyChange,
        noteTitle: draft.noteTitle.trim() || null,
        notes: draft.notes.trim() || null,
      };
      if (editingId !== null) {
        await updateCheckIn(editingId, input);
      } else {
        await createCheckIn({
          ...input,
          weatherCode: weather?.code ?? null,
          weatherTemp: weather?.temperature ?? null,
          weatherCity: weather?.city ?? null,
        });
      }
    } catch (e) {
      console.error('Saving check-in failed', e);
      setFailed(true);
      setSaving(false);
      return;
    }

    setDone(true);
    if (editing) leave(); // back to where the edit started; the daily log reloads on focus
    else finishNew(level <= LOW_BATTERY_MAX);
  };

  const cancel = async () => {
    if (!editing) {
      // A new check-in has unsaved answers, so ask before throwing them away.
      const discard = await showDialog({
        title: t('checkin.confirm.discardTitle'),
        message: t('checkin.confirm.discardMessage'),
        primaryLabel: t('checkin.confirm.discardConfirm'),
        secondaryLabel: t('checkin.confirm.discardKeep'),
        secondaryVariant: 'outline',
      });
      if (!discard) return;
    }
    setDone(true);
    leave(); // closing the flow also throws the draft away
  };

  const footer = (
    <View style={styles.footer}>
      <Button variant="secondary" label={t('checkin.confirm.cancel')} onPress={cancel} disabled={saving} style={styles.action} />
      <Button
        label={t(editing ? 'checkin.confirm.confirmEdit' : 'checkin.confirm.confirm')}
        onPress={save}
        loading={saving}
        style={styles.action}
      />
    </View>
  );

  return (
    <Screen footer={footer}>
      <BackButton />
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        {t(editing ? 'checkin.confirm.titleEdit' : 'checkin.confirm.title')}
      </AppText>

      <View style={styles.battery}>
        <BatteryIcon level={level} />
      </View>

      <Card flush>
        <SummaryRow
          label={t('checkin.confirm.state')}
          value={moodText}
          muted={draft.moods.length === 0}
          hint={hint}
          onPress={() => router.push('/checkin/mood')}
        />
        <View style={styles.divider} />
        <SummaryRow
          label={t('checkin.confirm.activity')}
          value={activityText}
          muted={!draft.activity.trim()}
          hint={hint}
          onPress={() => router.push('/checkin/activity')}
        />
        <View style={styles.divider} />
        <SummaryRow
          label={t('checkin.confirm.note')}
          value={noteText}
          muted={!draft.noteTitle.trim() && !draft.notes.trim()}
          hint={hint}
          onPress={() => router.push('/checkin/notes')}
        />
        <View style={styles.divider} />
        <View
          style={styles.weatherRow}
          accessible
          accessibilityLabel={`${t('checkin.confirm.weather')}: ${weatherText}`}
        >
          <Feather name="cloud" size={20} color={theme.colors.detail} />
          <View style={styles.rowText}>
            <AppText variant="eyebrow">{t('checkin.confirm.weather')}</AppText>
            <AppText variant="body" color={weather ? 'ink' : 'muted'}>
              {weatherText}
            </AppText>
          </View>
        </View>
      </Card>

      {failed && (
        <AppText color="error" style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {t('checkin.confirm.saveError')}
        </AppText>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  title: { marginTop: t.spacing.sm },
  battery: { alignItems: 'center', marginVertical: t.spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.sm,
  },
  rowText: { flex: 1, gap: t.spacing.xxs },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    minHeight: 64,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.sm,
  },
  divider: { height: 1, backgroundColor: t.colors.line, marginHorizontal: t.spacing.lg },
  pressed: { opacity: 0.6 },
  error: { marginTop: t.spacing.lg },
  missing: { marginVertical: t.spacing.xl },
  footer: { flexDirection: 'row', gap: t.spacing.sm },
  action: { flex: 1 },
}));
