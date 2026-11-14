import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import {
  borderWidth,
  colorblindPalette,
  darkPalette,
  fontScales,
  lightPalette,
  Palette,
  radius,
  shadowOffset,
  spacing,
  type ThemeName,
} from './tokens';

export interface Theme {
  /** Which palette is active. */
  name: ThemeName;
  /** Light or dark base, used for the status bar. The colour-blind theme is light. */
  scheme: 'light' | 'dark';
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  borderWidth: number;
  shadowOffset: number;
  /** Multiplier from Settings → Display → Font size */
  fontScale: number;
  /** Scale a font size / line height by the user's font size setting. */
  font(size: number): number;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceScheme = useColorScheme();
  const { settings } = useSettings();
  const { theme: themePref, fontSize } = settings.display;

  const theme = useMemo<Theme>(() => {
    const name: ThemeName =
      themePref === 'device' ? (deviceScheme === 'dark' ? 'dark' : 'light') : themePref;
    const fontScale = fontScales[fontSize];
    return {
      name,
      scheme: name === 'dark' ? 'dark' : 'light',
      colors: name === 'dark' ? darkPalette : name === 'colorblind' ? colorblindPalette : lightPalette,
      spacing,
      radius,
      borderWidth,
      shadowOffset,
      fontScale,
      font: (size: number) => Math.round(size * fontScale),
    };
  }, [deviceScheme, themePref, fontSize]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

/**
 * Create a themed style hook:
 *   const useStyles = makeStyles((t) => ({ box: { backgroundColor: t.colors.card } }));
 *   const styles = useStyles();
 */
type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

export function makeStyles<T extends NamedStyles>(factory: (theme: Theme) => T) {
  return function useStyles(): Readonly<T> {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}
