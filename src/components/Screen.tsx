import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';

interface ScreenProps {
  children: React.ReactNode;
  /** Wrap content in a ScrollView (default true). */
  scroll?: boolean;
  /** Pinned under the scroll area (e.g. the Skip / Next buttons). */
  footer?: React.ReactNode;
  /**
   * Safe-area edges. Screens inside the tab navigator should leave out
   * 'bottom' because the tab bar handles it.
   */
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}

/** Standard screen: themed background, safe areas, keyboard avoidance, scroll. */
export function Screen({ children, scroll = true, footer, edges = ['top', 'bottom'], contentStyle }: ScreenProps) {
  const styles = useStyles();
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {body}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** "← Back" / "← Profile" link at the top of a screen. */
export function BackLink({ label = 'Back', onPress }: { label?: string; onPress?: () => void }) {
  const theme = useTheme();
  const styles = useStyles();
  const handle = onPress ?? (() => router.canGoBack() && router.back());
  return (
    <Pressable
      onPress={handle}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={label === 'Back' ? 'Go back' : `Back to ${label}`}
      style={({ pressed }) => [styles.back, pressed && styles.pressed]}
    >
      <Feather name="arrow-left" size={18} color={theme.colors.muted} />
      <AppText variant="body" color="muted" style={styles.backLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** "REMINDERS", "QUIET HOURS" … section headings. */
export function SectionLabel({ children, style }: { children: string; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return (
    <View style={[styles.section, style]}>
      <AppText variant="eyebrow" accessibilityRole="header">
        {children}
      </AppText>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: t.spacing.xl,
    paddingTop: t.spacing.md,
    paddingBottom: t.spacing.xxl,
  },
  footer: {
    paddingHorizontal: t.spacing.xl,
    paddingTop: t.spacing.sm,
    paddingBottom: t.spacing.md,
    backgroundColor: t.colors.background,
  },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: t.spacing.xxs },
  backLabel: { marginLeft: t.spacing.xs },
  pressed: { opacity: 0.6 },
  section: { marginTop: t.spacing.xl, marginBottom: t.spacing.sm },
}));
