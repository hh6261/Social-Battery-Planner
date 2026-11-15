import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { formatPercent } from '@/i18n/format';
import { makeStyles } from '@/theme/ThemeProvider';

type Props = { level: number; size?: 'large' | 'small' };

/** The battery from the Home screen, with the percentage written inside (never colour alone). */
export default function BatteryIcon({ level, size = 'large' }: Props) {
  const { t } = useTranslation();
  const styles = useStyles();
  const safe = Math.min(100, Math.max(0, level));
  const percent = formatPercent(safe / 100);
  const big = size === 'large';

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('checkin.batteryIconLabel', { percent })}
    >
      <View style={[styles.body, big ? styles.bodyBig : styles.bodySmall]}>
        <View style={[styles.fill, big ? styles.fillBig : styles.fillSmall, { width: `${safe}%` }]} />
        <AppText variant={big ? 'heading' : 'label'} style={styles.percent}>
          {percent}
        </AppText>
      </View>
      <View style={[styles.tip, big ? styles.tipBig : styles.tipSmall]} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', direction: 'ltr' },
  body: {
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bodyBig: { width: 200, height: 96, borderRadius: 18, borderWidth: t.borderWidth + 1 },
  bodySmall: { width: 76, height: 34, borderRadius: 8, borderWidth: t.borderWidth },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: t.colors.shadow },
  fillBig: {},
  fillSmall: {},
  percent: { textAlign: 'center' },
  tip: { backgroundColor: t.colors.border },
  tipBig: { width: 8, height: 36, marginLeft: 2, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  tipSmall: { width: 4, height: 14, marginLeft: 1, borderTopRightRadius: 2, borderBottomRightRadius: 2 },
}));
