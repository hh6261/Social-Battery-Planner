import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';

interface ChipProps {
  label: string;
  /** Selectable chips (personalization). */
  selected?: boolean;
  onPress?: () => void;
  /** Shows the ⊖ remove button (profile). */
  onRemove?: () => void;
  size?: 'md' | 'sm';
}

export function Chip({ label, selected = false, onPress, onRemove, size = 'md' }: ChipProps) {
  const theme = useTheme();
  const styles = useStyles();
  const fg = selected ? 'onPrimary' : 'ink';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'checkbox' : 'text'}
      accessibilityState={onPress ? { checked: selected } : undefined}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        size === 'sm' && styles.small,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <AppText variant={size === 'sm' ? 'bodySmall' : 'body'} color={fg}>
        {label}
      </AppText>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          style={styles.remove}
        >
          <Feather name="minus" size={10} color={theme.colors.ink} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

/** Dashed "+ Add a situation" / "Add +" chip. */
export function AddChip({ label = '+ Add a situation', onPress, size = 'md' }: { label?: string; onPress(): void; size?: 'md' | 'sm' }) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label.replace('+', '').trim()}
      style={({ pressed }) => [styles.chip, styles.dashed, size === 'sm' && styles.small, pressed && styles.pressed]}
    >
      <AppText variant={size === 'sm' ? 'bodySmall' : 'body'}>{label}</AppText>
    </Pressable>
  );
}

export function ChipWrap({ children }: { children: React.ReactNode }) {
  const styles = useStyles();
  return <View style={styles.wrap}>{children}</View>;
}

const useStyles = makeStyles((t) => ({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: t.radius.pill,
    borderWidth: t.borderWidth,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.xs,
    minHeight: 44,
  },
  small: { minHeight: 38, paddingHorizontal: t.spacing.sm, paddingVertical: 6 },
  selected: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  dashed: { borderStyle: 'dashed', borderColor: t.colors.muted, backgroundColor: 'transparent' },
  pressed: { opacity: 0.75 },
  remove: {
    marginLeft: t.spacing.xs,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: t.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
