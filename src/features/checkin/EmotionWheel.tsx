import { StyleSheet, View } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

export type EmotionItem = { key: string; label: string };

type Props = {
  items: EmotionItem[];
  selected: string[];
  onToggle: (key: string) => void;
};

const SIZE = 340;
const CENTER = SIZE / 2;
const RADIUS = 145;
const POP = 12; // how far a selected slice moves outward
const LABEL_RADIUS = RADIUS * 0.66;

// Angle 0 is the top of the wheel, angles grow clockwise.
function point(angleDeg: number, radius: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(a), y: CENTER + radius * Math.sin(a) };
}

function slicePath(startDeg: number, endDeg: number) {
  const s = point(startDeg, RADIUS);
  const e = point(endDeg, RADIUS);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${s.x} ${s.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${e.x} ${e.y} Z`;
}

export default function EmotionWheel({ items, selected, onToggle }: Props) {
  const step = 360 / items.length;

  return (
    // Hidden from screen readers: they get the checkbox list instead (see mood.tsx).
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {items.map((item, i) => {
          const start = i * step;
          const end = (i + 1) * step;
          const mid = start + step / 2;
          const isOn = selected.includes(item.key);
          const pop = isOn ? point(mid, POP) : { x: CENTER, y: CENTER };
          const label = point(mid, LABEL_RADIUS);

          return (
            <G
              key={item.key}
              transform={`translate(${pop.x - CENTER} ${pop.y - CENTER})`}
              onPress={() => onToggle(item.key)}
            >
              <Path
                d={slicePath(start, end)}
                fill={isOn ? '#101828' : '#F2F4F7'}
                stroke="#344054"
                strokeWidth={2}
                strokeLinejoin="round"
              />
              <SvgText
                x={label.x}
                y={label.y}
                dy={4}
                fontSize={13}
                fontWeight="600"
                textAnchor="middle"
                fill={isOn ? '#FFFFFF' : '#101828'}
              >
                {item.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center' },
});