import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export const TOTAL_STEPS = 6;

export default function StepProgress({ current }: { current: number }) {
  const { t } = useTranslation();
  const label = t('checkin.progress', { current, total: TOTAL_STEPS });

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: TOTAL_STEPS, now: current }}
      style={styles.wrap}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(current / TOTAL_STEPS) * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 14, color: '#344054' },
  track: { height: 8, borderRadius: 4, backgroundColor: '#D0D5DD', overflow: 'hidden' },
  fill: { height: 8, backgroundColor: '#1D4ED8' },
});