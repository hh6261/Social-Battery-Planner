import React, { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { makeStyles, useTheme } from '../theme/ThemeProvider';

interface Props {
  value: boolean;
  onValueChange(next: boolean): void;
  accessibilityLabel: string;
  disabled?: boolean;
}

const TRACK_W = 52;
const TRACK_H = 30;
const KNOB = 22;
const PAD = 4;
const BORDER = 2;
/** Inner width (track − borders − padding) minus the knob. */
const TRAVEL = TRACK_W - BORDER * 2 - (PAD - BORDER) * 2 - KNOB;

/** Switch styled like the wireframe (dark track when on, outlined when off). */
export function Toggle({ value, onValueChange, accessibilityLabel, disabled }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: false }).start();
  }, [value, anim]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] });
  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.fill, theme.colors.primary],
  });

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      style={disabled ? styles.disabled : undefined}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[
            styles.knob,
            { transform: [{ translateX }] },
            value ? styles.knobOn : styles.knobOff,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    borderWidth: t.borderWidth,
    borderColor: t.colors.border,
    padding: PAD - 2,
    justifyContent: 'center',
  },
  knob: { width: KNOB, height: KNOB, borderRadius: KNOB / 2 },
  knobOn: { backgroundColor: t.colors.onPrimary },
  knobOff: { backgroundColor: t.colors.surface, borderWidth: 1.5, borderColor: t.colors.border },
  disabled: { opacity: 0.4 },
}));
