import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { makeStyles } from '../theme/ThemeProvider';
import { AppText } from './AppText';

export interface SegmentedOption<K extends string> {
  key: K;
  label: string;
  /** Spoken label when it differs from the short visible one (e.g. "<" becomes "Fewer than 5"). */
  accessibilityLabel?: string;
}

interface Props<K extends string> {
  options: SegmentedOption<K>[];
  /** null = nothing selected. */
  value: K | null;
  onChange(key: K): void;
  /** 'tab' for a Log | Plan switch, 'radio' for a single choice in a form. */
  role?: 'tab' | 'radio';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Outlined switch with one dark selected segment (same look as the tab bar). */
export function Segmented<K extends string>({
  options,
  value,
  onChange,
  role = 'radio',
  accessibilityLabel,
  style,
}: Props<K>) {
  const styles = useStyles();
  return (
    <View
      style={[styles.bar, style]}
      accessibilityRole={role === 'tab' ? 'tablist' : 'radiogroup'}
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((o) => {
        const selected = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole={role}
            accessibilityLabel={o.accessibilityLabel ?? o.label}
            accessibilityState={role === 'tab' ? { selected } : { checked: selected }}
            style={({ pressed }) => [styles.item, selected && styles.itemOn, pressed && !selected && styles.pressed]}
          >
            <AppText variant="label" color={selected ? 'onPrimary' : 'ink'} align="center">
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  bar: {
    flexDirection: 'row',
    borderWidth: t.borderWidth,
    borderColor: t.colors.border,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
    padding: 4,
    gap: 4,
  },
  item: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.md,
    paddingHorizontal: t.spacing.xs,
  },
  itemOn: { backgroundColor: t.colors.primary },
  pressed: { backgroundColor: t.colors.secondary },
}));
