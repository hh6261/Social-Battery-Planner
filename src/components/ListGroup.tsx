import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';

/** Outlined group of rows with dividers (Settings, Privacy & Data, Profile links). */
export function ListGroup({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.group, style]}>
      {rows.map((row, i) => (
        <View key={i}>
          {i > 0 && <View style={styles.divider} />}
          {row}
        </View>
      ))}
    </View>
  );
}

interface RowProps {
  title: string;
  subtitle?: string;
  /** Control on the right (Toggle, SelectField, TimeField). */
  right?: React.ReactNode;
  /** Makes the row tappable and adds a chevron. */
  onPress?: () => void;
  disabled?: boolean;
  /** Larger title weight, like the "From"/"To" rows. */
  emphasis?: boolean;
  accessibilityHint?: string;
}

export function ListRow({ title, subtitle, right, onPress, disabled, emphasis = true, accessibilityHint }: RowProps) {
  const theme = useTheme();
  const styles = useStyles();
  const content = (
    <View style={[styles.row, disabled && styles.disabled]}>
      <View style={styles.text}>
        <AppText variant={emphasis ? 'subheading' : 'body'}>{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" color="muted" style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
      {onPress ? <Feather name="chevron-right" size={22} color={theme.colors.ink} /> : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  group: {
    borderWidth: t.borderWidth,
    borderColor: t.colors.border,
    borderRadius: t.radius.xl,
    backgroundColor: t.colors.background,
    paddingHorizontal: t.spacing.lg,
  },
  divider: { height: t.borderWidth, backgroundColor: t.colors.line },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    paddingVertical: t.spacing.sm,
    gap: t.spacing.sm,
  },
  text: { flex: 1 },
  subtitle: { marginTop: 2 },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.45 },
}));
