/** Design tokens taken from the wireframes (monochrome, hard offset shadows). */

export interface Palette {
  /** Screen background */
  background: string;
  /** Cards and grouped lists */
  card: string;
  /** Inputs, dialogs, raised surfaces */
  surface: string;
  /** Main text and strong borders */
  ink: string;
  /** Secondary text */
  muted: string;
  /** Placeholder / tertiary text */
  subtle: string;
  /** Hairline dividers */
  line: string;
  /** 2px outlines on cards, inputs, chips */
  border: string;
  /** Hard offset shadow behind cards/buttons */
  shadow: string;
  primary: string;
  onPrimary: string;
  /** Light filled button ("Not right now", "Cancel") */
  secondary: string;
  /** Logo disc fill and other quiet fills */
  fill: string;
  overlay: string;
  error: string;
}

export const lightPalette: Palette = {
  background: '#F7F7F4',
  card: '#F1F1EE',
  surface: '#FFFFFF',
  ink: '#1E1E1E',
  muted: '#5C5C5C',
  subtle: '#8C8C8C',
  line: '#D2D2CF',
  border: '#2A2A2A',
  shadow: '#C6C6C2',
  primary: '#1E1E1E',
  onPrimary: '#FFFFFF',
  secondary: '#EDEDEA',
  fill: '#E4E4E1',
  overlay: 'rgba(20,20,20,0.6)',
  error: '#B3261E',
};

export const darkPalette: Palette = {
  background: '#141414',
  card: '#1D1D1D',
  surface: '#232323',
  ink: '#F2F2F0',
  muted: '#B4B4B0',
  subtle: '#85857F',
  line: '#3A3A38',
  border: '#E2E2DE',
  shadow: '#000000',
  primary: '#F2F2F0',
  onPrimary: '#141414',
  secondary: '#2E2E2C',
  fill: '#2E2E2C',
  overlay: 'rgba(0,0,0,0.7)',
  error: '#F2B8B5',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 28,
  pill: 999,
} as const;

export const borderWidth = 2;

/** Offset of the flat "hard" shadow used on cards and primary buttons. */
export const shadowOffset = 4;

export const fontScales = {
  small: 0.9,
  regular: 1,
  large: 1.15,
} as const;
