import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { listMoods } from '@/db/checkIns';
import { useCheckInDraft } from '@/features/checkin/CheckInDraft';
import StepFooter from '@/features/checkin/StepFooter';
import StepProgress from '@/features/checkin/StepProgress';

type Mood = { key: string; label: string };

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; moods: Mood[] };

const CHECK = '\u2713'; // check mark, shown on selected chips

export default function MoodStep() {
  const { t } = useTranslation();
  const { draft, update } = useCheckInDraft();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0); // goes up by 1 each time the user taps "Try again"

  useEffect(() => {
    let cancelled = false;
    listMoods()
      .then((moods) => {
        if (!cancelled) setState({ status: 'ready', moods });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true; // ignore an answer that arrives after the screen is gone
    };
  }, [attempt]);

  const retry = () => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  };

  const selected = draft.moods;
  const toggle = (key: string) => {
    update({
      moods: selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key],
    });
  };

  const next = () => router.push('/checkin/activity');

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <StepProgress current={2} />

        <Text style={styles.question} accessibilityRole="header">
          {t('checkin.mood.question')}
        </Text>
        <Text style={styles.hint}>{t('checkin.mood.hint')}</Text>

        {state.status === 'loading' && (
          <View style={styles.row} accessible accessibilityLabel={t('checkin.mood.loading')}>
            <ActivityIndicator />
            <Text>{t('checkin.mood.loading')}</Text>
          </View>
        )}

        {state.status === 'error' && (
          <View style={styles.column}>
            <Text accessibilityRole="alert">{t('checkin.mood.error')}</Text>
            <Button title={t('checkin.retry')} onPress={retry} />
          </View>
        )}

        {state.status === 'ready' && state.moods.length === 0 && (
          <Text>{t('checkin.mood.empty')}</Text>
        )}

        {state.status === 'ready' && state.moods.length > 0 && (
          <View style={styles.chips}>
            {state.moods.map((m) => {
              const isOn = selected.includes(m.key);
              const label = t(`checkin.mood.options.${m.key}`, { defaultValue: m.label });
              return (
                <Pressable
                  key={m.key}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isOn }}
                  accessibilityLabel={label}
                  onPress={() => toggle(m.key)}
                  style={[styles.chip, isOn && styles.chipOn]}
                >
                  <Text style={styles.check}>{isOn ? CHECK : null}</Text>
                  <Text style={styles.chipText}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <StepFooter onNext={next} nextDisabled={selected.length === 0} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 24, gap: 16 },
  question: { fontSize: 22, fontWeight: '600' },
  hint: { fontSize: 14, color: '#344054' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  column: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#667085',
    backgroundColor: '#FFFFFF',
  },
  chipOn: { borderColor: '#1D4ED8', backgroundColor: '#DBEAFE' },
  check: { width: 16, fontSize: 16, fontWeight: '700', color: '#1D4ED8' },
  chipText: { fontSize: 16, color: '#101828' },
});