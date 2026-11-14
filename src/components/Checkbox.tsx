import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';

interface Props {
  checked: boolean;
  onChange(next: boolean): void;
  /** Plain label, or pass children for inline links. */
  label?: string;
  children?: React.ReactNode;
  error?: string | null;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Checkbox({ checked, onChange, label, children, error, style, accessibilityLabel }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={style}>
      <View style={styles.row}>
        <Pressable
          onPress={() => onChange(!checked)}
          hitSlop={12}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel={accessibilityLabel ?? label}
          style={[styles.box, checked && styles.boxChecked, !!error && styles.boxError]}
        >
          {checked ? <Feather name="check" size={14} color={theme.colors.onPrimary} /> : null}
        </Pressable>
        <View style={styles.labelWrap}>
          {children ?? (
            <AppText variant="bodySmall" onPress={() => onChange(!checked)}>
              {label}
            </AppText>
          )}
        </View>
      </View>
      {error ? (
        <AppText variant="caption" color="error" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center' },
  box: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: t.borderWidth,
    borderColor: t.colors.muted,
    backgroundColor: t.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  boxError: { borderColor: t.colors.error },
  labelWrap: { flex: 1, marginLeft: t.spacing.sm },
  error: { marginTop: t.spacing.xxs, marginLeft: 34 },
}));
