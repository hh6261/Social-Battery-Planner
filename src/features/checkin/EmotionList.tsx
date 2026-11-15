import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import type { EmotionItem } from './EmotionWheel';

type Props = {
  items: EmotionItem[];
  selected: string[];
  onToggle: (key: string) => void;
};

export default function EmotionList({ items, selected, onToggle }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.chips}>
      {items.map((item) => {
        const isOn = selected.includes(item.key);
        return (
          <Pressable
            key={item.key}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isOn }}
            accessibilityLabel={item.label}
            onPress={() => onToggle(item.key)}
            style={({ pressed }) => [styles.chip, isOn && styles.chipOn, pressed && styles.pressed]}
          >
            {/* The check mark means a selection is not shown by colour alone */}
            {isOn ? <Feather name="check" size={16} color={theme.colors.onPrimary} /> : null}
            <AppText variant="body" color={isOn ? 'onPrimary' : 'ink'}>
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    minHeight: 48,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radius.pill,
    borderWidth: t.borderWidth,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  chipOn: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  pressed: { opacity: 0.75 },
}));
