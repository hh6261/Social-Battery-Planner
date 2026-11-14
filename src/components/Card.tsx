import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { HardShadow } from './HardShadow';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Removes inner padding, e.g. for grouped list rows. */
  flush?: boolean;
}

/** Rounded, outlined card with the hard offset shadow. */
export function Card({ children, style, contentStyle, flush }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <HardShadow radius={theme.radius.xl} style={style}>
      <View style={[styles.card, !flush && styles.padded, contentStyle]}>{children}</View>
    </HardShadow>
  );
}

/** Dashed outline box ("TODAY'S CHECK-IN" in onboarding). */
export function DashedBox({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return <View style={[styles.dashed, style]}>{children}</View>;
}

/**
 * Horizontal dashed rule. iOS ignores borderStyle 'dashed' on a single side,
 * so we clip a fully-bordered dashed box down to its top edge.
 */
export function DashedDivider({ style }: { style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return (
    <View style={[styles.dividerClip, style]} accessible={false}>
      <View style={styles.dividerInner} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  dividerClip: { height: t.borderWidth, overflow: 'hidden' },
  dividerInner: {
    height: t.borderWidth * 4,
    borderWidth: t.borderWidth,
    borderColor: t.colors.line,
    borderStyle: 'dashed',
  },
  card: {
    backgroundColor: t.colors.card,
    borderRadius: t.radius.xl,
    borderWidth: t.borderWidth,
    borderColor: t.colors.border,
    overflow: 'hidden',
  },
  padded: { padding: t.spacing.lg },
  dashed: {
    borderRadius: t.radius.md,
    borderWidth: t.borderWidth,
    borderColor: t.colors.muted,
    borderStyle: 'dashed',
    padding: t.spacing.md,
  },
}));
