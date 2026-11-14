import { Slider } from '@expo/ui/community/slider';
import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';

type Props = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  sliderLabel: string;
  decreaseLabel: string;
  increaseLabel: string;
};

/** A slider with a round minus button on the left and a plus button on the right. */
export default function StepSlider({
  value,
  min,
  max,
  step,
  onChange,
  sliderLabel,
  decreaseLabel,
  increaseLabel,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)));

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={decreaseLabel}
        onPress={() => onChange(clamp(value - step))}
        style={({ pressed }) => [styles.round, pressed && styles.pressed]}
      >
        <Feather name="minus" size={20} color={theme.colors.ink} />
      </Pressable>

      <View style={styles.slider}>
        <Slider
          value={value}
          minimumValue={min}
          maximumValue={max}
          step={step}
          onValueChange={(v: number) => onChange(clamp(v))}
          minimumTrackTintColor={theme.colors.ink}
          maximumTrackTintColor={theme.colors.line}
          thumbTintColor={theme.colors.ink}
          accessibilityLabel={sliderLabel}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={increaseLabel}
        onPress={() => onChange(clamp(value + step))}
        style={({ pressed }) => [styles.round, pressed && styles.pressed]}
      >
        <Feather name="plus" size={20} color={theme.colors.ink} />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  slider: { flex: 1 },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: t.borderWidth,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
}));
