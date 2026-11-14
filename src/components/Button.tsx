import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { HardShadow } from './HardShadow';

export type ButtonVariant = 'primary' | 'secondary' | 'outline';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
}

/**
 * primary   – dark fill (Log in, Create account, Next, Finish)
 * secondary – light grey fill with outline (Not right now, Cancel in log-out dialog)
 * outline   – white with outline (Skip, Cancel in delete dialog)
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  style,
  accessibilityHint,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const inactive = disabled || loading;
  const textColor = variant === 'primary' ? 'onPrimary' : 'ink';

  return (
    <HardShadow
      radius={theme.radius.lg}
      offset={variant === 'primary' && !inactive ? 3 : 0}
      style={style}
    >
      <Pressable
        testID={testID}
        onPress={onPress}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: inactive, busy: loading }}
        style={({ pressed }) => [
          styles.base,
          size === 'lg' ? styles.lg : styles.md,
          styles[variant],
          inactive && styles.inactive,
          pressed && styles.pressed,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors[textColor]} />
        ) : (
          <View style={styles.labelWrap}>
            <AppText variant="button" color={textColor} align="center">
              {label}
            </AppText>
          </View>
        )}
      </Pressable>
    </HardShadow>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    borderRadius: t.radius.lg,
    borderWidth: t.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: t.spacing.lg,
  },
  lg: { minHeight: 56 },
  md: { minHeight: 48 },
  primary: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  secondary: { backgroundColor: t.colors.secondary, borderColor: t.colors.border },
  outline: { backgroundColor: t.colors.surface, borderColor: t.colors.border },
  inactive: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ translateY: 1 }] },
  labelWrap: { paddingVertical: t.spacing.xs },
}));
