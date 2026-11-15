import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { I18nManager, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';

/** "← Back" at the top of every check-in step (same look as BackLink, but translated). */
export default function BackButton({ onPress }: { onPress?: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress ?? (() => router.canGoBack() && router.back())}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={t('checkin.backLabel')}
      style={({ pressed }) => [styles.back, pressed && styles.pressed]}
    >
      <Feather name={I18nManager.isRTL ? 'arrow-right' : 'arrow-left'} size={18} color={theme.colors.detail} />
      <AppText variant="body" color="muted" style={styles.label}>
        {t('checkin.back')}
      </AppText>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingVertical: t.spacing.xxs,
  },
  label: { marginLeft: t.spacing.xs },
  pressed: { opacity: 0.6 },
}));
