import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EmotionItem } from './EmotionWheel';

type Props = {
  items: EmotionItem[];
  selected: string[];
  onToggle: (key: string) => void;
};

const CHECK = '\u2713';

export default function EmotionList({ items, selected, onToggle }: Props) {
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
            style={[styles.chip, isOn && styles.chipOn]}
          >
            <Text style={styles.check}>{isOn ? CHECK : null}</Text>
            <Text style={styles.chipText}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#667085',
    backgroundColor: '#FFFFFF',
  },
  chipOn: { borderColor: '#1D4ED8', backgroundColor: '#DBEAFE' },
  check: { width: 16, fontSize: 16, fontWeight: '700', color: '#1D4ED8' },
  chipText: { fontSize: 16, color: '#101828' },
});