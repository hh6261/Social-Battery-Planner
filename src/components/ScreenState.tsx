import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, minTouchSize, spacing } from '@/theme/colors';

export type ScreenStateKind = 'loading' | 'empty' | 'error' | 'offline';

type Props = {
  kind: ScreenStateKind;
  /** Already translated. Falls back to a generic text for the kind. */
  title?: string;
  /** Already translated. Falls back to a generic text for the kind. */
  message?: string;
  /** Shows a Retry button (error/offline) or an action button (empty). */
  onAction?: () => void;
  /** Already translated label for the action button. Defaults to "Try again". */
  actionLabel?: string;
};

/**
 * One component for the four non-ideal states (F6). Use it on every screen
 * that loads data, so they all look and behave the same:
 *
 *   if (loading) return <ScreenState kind="loading" />;
 *   if (error)   return <ScreenState kind="error" onAction={reload} />;
 *   if (!items.length) return <ScreenState kind="empty" title={t('x.empty')} />;
 */
export function ScreenState({ kind, title, message, onAction, actionLabel }: Props) {
  const { t } = useTranslation();

  const heading = title ?? t(`state.${kind}.title`);
  const body = message ?? (kind === 'loading' ? undefined : t(`state.${kind}.message`));
  const isProblem = kind === 'error' || kind === 'offline';

  return (
    <View
      style={styles.container}
      // Screen readers announce the change without the user having to find it.
      accessibilityLiveRegion={isProblem ? 'assertive' : 'polite'}
      accessibilityRole={isProblem ? 'alert' : undefined}
    >
      {kind === 'loading' && (
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel={heading} />
      )}
      <Text style={styles.title} accessibilityRole="header">
        {heading}
      </Text>
      {body ? <Text style={styles.message}>{body}</Text> : null}
      {onAction && kind !== 'loading' ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>{actionLabel ?? t('state.retry')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 360,
  },
  button: {
    minHeight: minTouchSize,
    minWidth: minTouchSize,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
});
