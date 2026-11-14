import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
  radius: number;
  /** Defaults to theme.shadowOffset. Pass 0 to hide (e.g. pressed state). */
  offset?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * The flat, offset shadow from the wireframes. Drawn as a View behind the
 * content so it looks the same on iOS and Android (elevation can't do this).
 */
export function HardShadow({ children, radius, offset, style }: Props) {
  const theme = useTheme();
  const o = offset ?? theme.shadowOffset;
  return (
    <View style={style}>
      {o > 0 && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: o,
            left: o,
            right: -o,
            bottom: -o,
            borderRadius: radius,
            backgroundColor: theme.colors.shadow,
          }}
        />
      )}
      {children}
    </View>
  );
}
