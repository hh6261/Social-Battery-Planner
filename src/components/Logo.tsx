import { Feather } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  /** Diameter of the disc. */
  size?: number;
  /** The + / − badges shown on the splash screen. */
  badges?: boolean;
}

/** Social Battery mark: a battery inside a disc, two bars full, one dashed. */
export function Logo({ size = 120, badges = false }: Props) {
  const { colors } = useTheme();
  const stroke = Math.max(2, Math.round(size / 45));
  const bodyW = size * 0.52;
  const bodyH = size * 0.34;
  const barW = bodyW * 0.14;
  const barH = bodyH * 0.58;
  const badge = size * 0.22;

  const bar = (dashed: boolean, key: number) => (
    <View
      key={key}
      style={{
        width: barW,
        height: barH,
        borderRadius: barW / 3,
        marginHorizontal: barW * 0.22,
        backgroundColor: dashed ? 'transparent' : colors.ink,
        borderWidth: dashed ? stroke * 0.75 : 0,
        borderStyle: 'dashed',
        borderColor: colors.muted,
      }}
    />
  );

  const badgeView = (icon: 'plus' | 'minus', pos: object) => (
    <View
      style={[
        {
          position: 'absolute',
          width: badge,
          height: badge,
          borderRadius: badge / 2,
          borderWidth: stroke,
          borderColor: colors.ink,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pos,
      ]}
    >
      <Feather name={icon} size={badge * 0.55} color={colors.ink} />
    </View>
  );

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Social Battery logo"
      style={{ width: size, height: size }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: colors.ink,
          backgroundColor: colors.fill,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: bodyW,
              height: bodyH,
              borderRadius: bodyH * 0.22,
              borderWidth: stroke * 1.2,
              borderColor: colors.ink,
              backgroundColor: colors.surface,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: barW * 0.5,
            }}
          >
            {[false, false, true].map((dashed, i) => bar(dashed, i))}
          </View>
          <View
            style={{
              width: stroke * 1.6,
              height: bodyH * 0.36,
              borderTopRightRadius: stroke,
              borderBottomRightRadius: stroke,
              backgroundColor: colors.ink,
            }}
          />
        </View>
      </View>
      {badges && badgeView('minus', { top: size * 0.06, right: -badge * 0.15 })}
      {badges && badgeView('plus', { bottom: size * 0.1, left: -badge * 0.15 })}
    </View>
  );
}
