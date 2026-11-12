import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Slider from '@expo/ui/community/slider';

import { useCheckInDraft } from '@/features/checkin/CheckInDraft';
import StepProgress from '@/features/checkin/StepProgress';
import { formatPercent } from '@/i18n/format';

const clampLevel = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

function stateOf(level: number): 'low' | 'medium' | 'high' {
  if (level <= 30) return 'low';
  if (level <= 60) return 'medium';
  return 'high';
}

export default function BatteryStep() {
  const { t } = useTranslation();
  const { draft, update } = useCheckInDraft();
  const params = useLocalSearchParams<{ level?: string }>();

  // Start value: what the user already chose, else the Home slider value (?level=40), else 50.
  const fromParam =
    params.level !== undefined && Number.isFinite(Number(params.level))
      ? clampLevel(Number(params.level))
      : null;
  const [level, setLevel] = useState(draft.batteryLevel ?? fromParam ?? 50);

  const next = () => {
    update({ batteryLevel: level });
    router.push('/checkin/mood');
  };

  return (
    <View style={styles.container}>
      <StepProgress current={1} />

      <Text style={styles.question} accessibilityRole="header">
        {t('checkin.battery.question')}
      </Text>

      <Text style={styles.value} accessibilityLiveRegion="polite">
        {formatPercent(level / 100)}
      </Text>
      <Text style={styles.state}>{t(`checkin.battery.state.${stateOf(level)}`)}</Text>

      <Slider
        value={level}
        minimumValue={0}
        maximumValue={100}
        step={5}
        onValueChange={(v: number) => setLevel(clampLevel(v))}
        accessibilityLabel={t('checkin.battery.sliderLabel')}
      />

      {/* Buttons as an alternative to dragging, easier with a screen reader or limited motor control */}
      <View style={styles.row}>
        <Button title={t('checkin.battery.lower')} onPress={() => setLevel((l) => clampLevel(l - 5))} />
        <Button title={t('checkin.battery.higher')} onPress={() => setLevel((l) => clampLevel(l + 5))} />
      </View>

      <Button title={t('checkin.next')} onPress={next} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
  question: { fontSize: 22, fontWeight: '600' },
  value: { fontSize: 48, fontWeight: '700', textAlign: 'center' },
  state: { fontSize: 16, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});