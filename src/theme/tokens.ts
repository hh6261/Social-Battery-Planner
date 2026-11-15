/**
 * Design tokens: the hard offset shadows and 2px outlines from the wireframes, coloured with the
 * brand palette (Almond Cream, Desert Sand, Light Bronze, Ash Grey, Dry Sage, Dusty Olive).
 * Contrast of every text/background pair was checked against WCAG 2.2 AA (4.5:1 for text, 3:1 for
 * borders and the battery bar). Re-check a pair before you change a colour.
 */

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
  /** Brand accent (Light Bronze in the default themes) */
  accent: string;
  /** Darker colour for small details: eyebrow labels, small icons */
  detail: string;
  /** Selected chips and rows (text in `primary` or `ink` stays readable on it) */
  selected: string;
  /** Drains, errors */
  danger: string;
  dangerSurface: string;
  /** Rain hints and other cautions */
  warning: string;
  warningSurface: string;
  /** Recharges, good news. Never the only signal: text always says it too. */
  success: string;
  /** Empty part of bars and charts */
  track: string;
  /** Battery bands. In the colorblind theme these are vermillion, grey and blue (no red/green pair). */
  batteryLow: string;
  batteryMid: string;
  batteryHigh: string;
  overlay: string;
  error: string;
}

export type ThemeName = 'light' | 'dark' | 'colorblind';

/** Default light theme: a light cream background, Almond Cream cards, Desert Sand dividers, Ash Grey fills, Light Bronze shadows, and dark Dusty Olive / bronze for small details. */
export const lightPalette: Palette = {
  background: '#FFF8F2',
  card: '#FFE8D6',
  surface: '#FFFDFA',
  ink: '#2B2F21',
  muted: '#4F5442',
  subtle: '#6B705C',
  line: '#DDBEA9',
  border: '#3A3F2E',
  shadow: '#CB997E',
  primary: '#4A4F3B',
  onPrimary: '#FFF8F2',
  secondary: '#B7B7A4',
  fill: '#A5A58D',
  accent: '#CB997E',
  detail: '#7E4B33',
  selected: '#EBCFBA',
  danger: '#9B2C1F',
  dangerSurface: '#FBE0D8',
  warning: '#7A4A12',
  warningSurface: '#F6E1C3',
  success: '#3F6B34',
  track: '#E3DFD0',
  batteryLow: '#9B2C1F',
  batteryMid: '#7A4A12',
  batteryHigh: '#3F6B34',
  error: '#9B2C1F',
  overlay: 'rgba(43,47,33,0.6)',
};

/** Dark theme: deep olive background with Almond Cream and Desert Sand text and Light Bronze details. */
export const darkPalette: Palette = {
  background: '#22251C',
  card: '#2C3023',
  surface: '#353A2B',
  ink: '#FFE8D6',
  muted: '#DDBEA9',
  subtle: '#B7B7A4',
  line: '#484D3A',
  border: '#B7B7A4',
  shadow: '#10120C',
  primary: '#DDBEA9',
  onPrimary: '#22251C',
  secondary: '#41463A',
  fill: '#4F5442',
  accent: '#CB997E',
  detail: '#CB997E',
  selected: '#4A4F3C',
  danger: '#F2B8B5',
  dangerSurface: '#4A2623',
  warning: '#F2D19C',
  warningSurface: '#47381F',
  success: '#B9D9A0',
  track: '#484D3A',
  batteryLow: '#F08A7D',
  batteryMid: '#E8B84A',
  batteryHigh: '#9CCB7E',
  error: '#F2B8B5',
  overlay: 'rgba(0,0,0,0.7)',
};

/** Colour-blind friendly theme (Okabe-Ito colours): blue and vermillion instead of green and red, black text on white, extra strong contrast. */
export const colorblindPalette: Palette = {
  background: '#FFFFFF',
  card: '#F1F6FB',
  surface: '#FFFFFF',
  ink: '#0B0B0B',
  muted: '#3D3D3D',
  subtle: '#595959',
  line: '#C9D3DD',
  border: '#0B0B0B',
  shadow: '#56B4E9',
  primary: '#0072B2',
  onPrimary: '#FFFFFF',
  secondary: '#DCEBF5',
  fill: '#DCEBF5',
  accent: '#E69F00',
  detail: '#004F7C',
  selected: '#E6F1FA',
  danger: '#A63D00',
  dangerSurface: '#FBE3D3',
  warning: '#7A5200',
  warningSurface: '#FFF0C7',
  success: '#005B8F',
  track: '#D5DEE8',
  batteryLow: '#A63D00',
  batteryMid: '#6E6E6E',
  batteryHigh: '#0072B2',
  error: '#A63D00',
  overlay: 'rgba(11,11,11,0.6)',
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
