import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { useCheckInDraft } from '@/features/checkin/CheckInDraft';
import StepScreen from '@/features/checkin/StepScreen';
import StepSlider from '@/features/checkin/StepSlider';
import { formatPercent } from '@/i18n/format';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';

const STEP = 5;

export default function ImpactStep() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const { draft, update } = useCheckInDraft();

  const change = draft.energyChange ?? 0; // -100 (drained me) to 100 (recharged me)
  const state = change < 0 ? 'drain' : change > 0 ? 'recharge' : 'neutral';
  const icon = change > 0 ? 'arrow-up' : change < 0 ? 'arrow-down' : 'minus';
  const percent = formatPercent(Math.abs(change) / 100);
  const summary = t('checkin.impact.summary', { state: t(`checkin.impact.state.${state}`), value: percent });

  const next = () => {
    update({ energyChange: change });
    router.push('/checkin/notes');
  };
  const skip = () => {
    update({ energyChange: null });
    router.push('/checkin/notes');
  };

  const end = (key: 'drain' | 'neutral' | 'recharge', label: string) => (
    <AppText variant="bodySmall" color={state === key ? 'ink' : 'muted'} weight={state === key ? '700' : '400'}>
      {label}
    </AppText>
  );

  return (
    <StepScreen step={5} title={t('checkin.impact.title')} onNext={next} onSkip={skip}>
      {/* The big arrow and percentage; read out as one sentence and announced when it changes */}
      <Card contentStyle={styles.display}>
        <View
          style={styles.displayRow}
          accessible
          accessibilityLabel={summary}
          accessibilityLiveRegion="polite"
        >
          <Feather name={icon} size={44} color={theme.colors.ink} />
          <AppText variant="display">{percent}</AppText>
        </View>
      </Card>

      <View>
        <View style={styles.ends}>
          {end('drain', t('checkin.impact.endDrain'))}
          {end('neutral', t('checkin.impact.endNeutral'))}
          {end('recharge', t('checkin.impact.endRecharge'))}
        </View>
        <StepSlider
          value={change}
          min={-100}
          max={100}
          step={STEP}
          onChange={(v) => update({ energyChange: v })}
          sliderLabel={t('checkin.impact.slider')}
          decreaseLabel={t('checkin.impact.decrease')}
          increaseLabel={t('checkin.impact.increase')}
        />
        <View style={styles.scale}>
          <AppText variant="caption" color="muted">
            {formatPercent(-1)}
          </AppText>
          <AppText variant="caption" color="muted">
            {formatPercent(1)}
          </AppText>
        </View>
      </View>

      <AppText variant="bodySmall" color="muted" align="center">
        {t('checkin.impact.caption')}
      </AppText>
    </StepScreen>
  );
}

const useStyles = makeStyles((t) => ({
  display: { alignItems: 'center', paddingVertical: t.spacing.lg },
  displayRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: t.spacing.xs },
  scale: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 52 },
}));
