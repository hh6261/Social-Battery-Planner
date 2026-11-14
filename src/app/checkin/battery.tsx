import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import BatteryIcon from '@/features/checkin/BatteryIcon';
import { useCheckInDraft } from '@/features/checkin/CheckInDraft';
import StepScreen from '@/features/checkin/StepScreen';
import StepSlider from '@/features/checkin/StepSlider';
import { formatPercent } from '@/i18n/format';
import { makeStyles } from '@/theme/ThemeProvider';

const clampLevel = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

function stateOf(level: number): 'low' | 'medium' | 'high' {
  if (level <= 30) return 'low';
  if (level <= 60) return 'medium';
  return 'high';
}

export default function BatteryStep() {
  const { t } = useTranslation();
  const styles = useStyles();
  const { draft, update } = useCheckInDraft();
  const params = useLocalSearchParams<{ level?: string }>();

  // Start value: what the user already chose, else the Home slider value (?level=40), else 50.
  const fromParam =
    params.level !== undefined && Number.isFinite(Number(params.level))
      ? clampLevel(Number(params.level))
      : null;
  const [level, setLevel] = useState(draft.batteryLevel ?? fromParam ?? 50);

  const change = (value: number) => {
    setLevel(value);
    update({ batteryLevel: value }); // keep the draft current, so Back never loses it
  };

  const next = () => {
    update({ batteryLevel: level });
    router.push('/checkin/mood');
  };

  return (
    <StepScreen step={1} title={t('checkin.battery.question')} onNext={next}>
      <View style={styles.center}>
        <BatteryIcon level={level} />
        <AppText variant="display" accessibilityLiveRegion="polite" style={styles.value}>
          {formatPercent(level / 100)}
        </AppText>
        <AppText variant="subheading" color="muted">
          {t(`checkin.battery.state.${stateOf(level)}`)}
        </AppText>
      </View>

      {/* Buttons next to the slider as an alternative to dragging (screen reader, motor control) */}
      <StepSlider
        value={level}
        min={0}
        max={100}
        step={5}
        onChange={change}
        sliderLabel={t('checkin.battery.sliderLabel')}
        decreaseLabel={t('checkin.battery.lower')}
        increaseLabel={t('checkin.battery.higher')}
      />
    </StepScreen>
  );
}

const useStyles = makeStyles((t) => ({
  center: { alignItems: 'center', gap: t.spacing.xs },
  value: { marginTop: t.spacing.md },
}));
