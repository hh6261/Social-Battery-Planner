import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { Palette } from '../theme/tokens';
import { useTheme } from '../theme/ThemeProvider';

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodySmall'
  | 'label'
  | 'caption'
  | 'eyebrow'
  | 'button';

const VARIANTS: Record<TextVariant, { size: number; line: number; weight: TextStyle['fontWeight']; spacing?: number; upper?: boolean }> = {
  display: { size: 34, line: 40, weight: '700', spacing: -0.8 },
  title: { size: 30, line: 36, weight: '700', spacing: -0.6 },
  heading: { size: 22, line: 28, weight: '700', spacing: -0.3 },
  subheading: { size: 17, line: 22, weight: '600' },
  body: { size: 16, line: 24, weight: '400' },
  bodySmall: { size: 14, line: 20, weight: '400' },
  label: { size: 14, line: 20, weight: '600' },
  caption: { size: 12, line: 16, weight: '400' },
  eyebrow: { size: 12, line: 16, weight: '600', spacing: 2.4, upper: true },
  button: { size: 16, line: 20, weight: '600' },
};

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: keyof Palette;
  align?: TextStyle['textAlign'];
  weight?: TextStyle['fontWeight'];
}

/** Text that follows the theme colours and the user's font size setting. */
export function AppText({
  variant = 'body',
  color,
  align,
  weight,
  style,
  children,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const v = VARIANTS[variant];
  const defaultColor: keyof Palette = variant === 'eyebrow' ? 'muted' : 'ink';
  const text = v.upper && typeof children === 'string' ? children.toUpperCase() : children;

  return (
    <Text
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[
        {
          color: theme.colors[color ?? defaultColor],
          fontSize: theme.font(v.size),
          lineHeight: theme.font(v.line),
          fontWeight: weight ?? v.weight,
          letterSpacing: v.spacing,
          textAlign: align,
        },
        style,
      ]}
    >
      {text}
    </Text>
  );
}
