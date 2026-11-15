import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { makeStyles } from '@/theme/ThemeProvider';

export const TOTAL_STEPS = 6;

export default function StepProgress({ current }: { current: number }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const label = t('checkin.progress', { current, total: TOTAL_STEPS });

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: TOTAL_STEPS, now: current }}
      style={styles.wrap}
    >
      <AppText variant="eyebrow">{label}</AppText>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(current / TOTAL_STEPS) * 100}%` }]} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing.xs, marginBottom: t.spacing.md },
  track: {
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: t.colors.primary },
}));
