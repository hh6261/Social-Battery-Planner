import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { listMoods } from '@/db/checkIns';
import { useCheckInDraft } from '@/features/checkin/CheckInDraft';
import EmotionList from '@/features/checkin/EmotionList';
import EmotionWheel, { type EmotionItem } from '@/features/checkin/EmotionWheel';
import StepFooter from '@/features/checkin/StepFooter';
import StepProgress from '@/features/checkin/StepProgress';
import { useScreenReaderEnabled } from '@/features/checkin/useScreenReaderEnabled';
import { WHEEL_MOOD_ORDER } from '@/features/checkin/wheelMoods';

type Mood = Awaited<ReturnType<typeof listMoods>>[number];

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; moods: Mood[] };

// iOS ignores accessibilityLiveRegion, so announce there explicitly.
function announceOnIOS(message: string) {
  if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
}

export default function MoodStep() {
  const { t } = useTranslation();
  const { draft, update } = useCheckInDraft();
  const screenReader = useScreenReaderEnabled();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0); // goes up by 1 each time the user taps "Try again"
  // null = follow the screen reader setting; true/false = the user's own choice.
  const [listChoice, setListChoice] = useState<boolean | null>(null);
  const showList = listChoice ?? screenReader;

  useEffect(() => {
    let cancelled = false;
    listMoods()
      .then((all) => {
        // keep only the emotions of the wheel, in wheel order
        const moods = WHEEL_MOOD_ORDER.flatMap((key) => {
          const found = all.find((m) => m.key === key);
          return found ? [found] : [];
        });
        if (!cancelled) setState({ status: 'ready', moods });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true; // ignore an answer that arrives after the screen is gone
    };
  }, [attempt]);

  useEffect(() => {
    if (state.status === 'error') announceOnIOS(t('checkin.mood.error'));
  }, [state.status, t]);

  const retry = () => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  };

  const items: EmotionItem[] =
    state.status === 'ready'
      ? state.moods.map((m) => ({
          key: m.key,
          label: t(`checkin.mood.options.${m.key}`, { defaultValue: m.label }),
        }))
      : [];

  const selected = draft.moods;
  // While the list is loading or failed, trust the draft so earlier choices still count.
  const count =
    state.status === 'ready'
      ? selected.filter((k) => items.some((i) => i.key === k)).length
      : selected.length;

  const toggle = (key: string) => {
    const moods = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key];
    update({ moods });
    announceOnIOS(t('checkin.mood.selectedCount', { count: moods.length }));
  };

  const next = () => router.push('/checkin/activity');
  const skip = () => {
    update({ moods: [] });
    router.push('/checkin/activity');
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <StepProgress current={2} />

        <Text style={styles.question} accessibilityRole="header">
          {t('checkin.mood.question')}
        </Text>
        <Text style={styles.hint}>{t('checkin.mood.hint')}</Text>

        {state.status === 'loading' && (
          <View style={styles.row} accessible>
            <ActivityIndicator />
            <Text>{t('checkin.mood.loading')}</Text>
          </View>
        )}

        {state.status === 'error' && (
          <View style={styles.column}>
            <Text accessibilityRole="alert" accessibilityLiveRegion="assertive">
              {t('checkin.mood.error')}
            </Text>
            <Button title={t('checkin.retry')} onPress={retry} />
          </View>
        )}

        {state.status === 'ready' && items.length === 0 && <Text>{t('checkin.mood.empty')}</Text>}

        {state.status === 'ready' && items.length > 0 && (
          <>
            {/* A normal button, so Switch Control, Voice Control and keyboard users can reach the list. */}
            <View style={styles.toggle}>
              <Button
                title={showList ? t('checkin.mood.showWheel') : t('checkin.mood.showList')}
                onPress={() => setListChoice(!showList)}
              />
            </View>
            {showList ? (
              <EmotionList items={items} selected={selected} onToggle={toggle} />
            ) : (
              <EmotionWheel items={items} selected={selected} onToggle={toggle} />
            )}
            <Text style={styles.count} accessibilityLiveRegion="polite">
              {t('checkin.mood.selectedCount', { count })}
            </Text>
          </>
        )}
      </ScrollView>

      <StepFooter onNext={next} nextDisabled={count === 0} onSkip={skip} />
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
  toggle: { alignSelf: 'flex-start' },
  count: { fontSize: 16, color: '#101828' },
});
