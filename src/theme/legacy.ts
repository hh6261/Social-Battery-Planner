import { useMemo } from 'react';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';

import { useTheme, type Theme } from './ThemeProvider';

/**
 * Bridge for the Insights, Plan ahead and Recharge screens, which were written with their own colour
 * names (`colors.text`, `colors.surface` ...) before the app theme existed. The names are kept, but
 * the values now come from the active theme (light, dark or colour-blind), so those screens follow
 * Settings > Theme and have the same look as Home and Profile: 2px outlines, rounder corners and the
 * font size from Settings > Font size.
 */
export function legacyColors(t: Theme) {
  const c = t.colors;
  return {
    background: c.background,
    surface: c.card,
    text: c.ink,
    textMuted: c.muted,
    primary: c.primary,
    primarySurface: c.selected,
    onPrimary: c.onPrimary,
    border: c.border,
    focus: c.primary,
    danger: c.danger,
    dangerSurface: c.dangerSurface,
    warning: c.warning,
    warningSurface: c.warningSurface,
    success: c.success,
    track: c.track,
    batteryLow: c.batteryLow,
    batteryMid: c.batteryMid,
    batteryHigh: c.batteryHigh,
  };
}
export type LegacyColors = ReturnType<typeof legacyColors>;

export const legacySpacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export type LegacySpacing = typeof legacySpacing;

/** The comfortable touch size from the brief (7.2). */
export const minTouchSize = 44;

export function useLegacyColors(): LegacyColors {
  const theme = useTheme();
  return useMemo(() => legacyColors(theme), [theme]);
}

type AnyStyle = ViewStyle & TextStyle & ImageStyle;
type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

/** Applies the app look to one old-style rule. */
function restyle(t: Theme, c: LegacyColors, style: AnyStyle): AnyStyle {
  const s: AnyStyle = { ...style };
  if (typeof s.fontSize === 'number') s.fontSize = t.font(s.fontSize);
  if (typeof s.lineHeight === 'number') s.lineHeight = t.font(s.lineHeight);
  if (s.borderWidth === 1) s.borderWidth = t.borderWidth;
  if (typeof s.borderRadius === 'number' && s.position !== 'absolute') {
    if (s.borderRadius >= 6 && s.borderRadius <= 10) s.borderRadius = t.radius.md;
    else if (s.borderRadius === 22) s.borderRadius = t.radius.pill;
  }
  const isCard =
    s.backgroundColor === c.surface &&
    s.borderRadius !== undefined &&
    s.borderWidth === undefined &&
    s.position !== 'absolute';
  if (isCard) {
    s.borderWidth = t.borderWidth;
    s.borderColor = t.colors.border;
    s.borderRadius = t.radius.lg;
  }
  const isFilledButton =
    s.backgroundColor === c.primary && typeof s.minHeight === 'number' && s.borderRadius !== undefined;
  if (isFilledButton) {
    s.borderWidth = t.borderWidth;
    s.borderColor = c.primary;
    s.borderRadius = t.radius.lg;
  }
  return s;
}

/** Like makeStyles, but the factory gets the old `colors` and `spacing` objects. */
export function makeLegacyStyles<T extends NamedStyles>(factory: (colors: LegacyColors, spacing: LegacySpacing) => T) {
  return function useStyles(): Readonly<T> {
    const theme = useTheme();
    return useMemo(() => {
      const colors = legacyColors(theme);
      const raw = factory(colors, legacySpacing);
      const out: NamedStyles = {};
      for (const key of Object.keys(raw)) out[key] = restyle(theme, colors, raw[key] as AnyStyle);
      return StyleSheet.create(out) as unknown as T;
    }, [theme]);
  };
}
