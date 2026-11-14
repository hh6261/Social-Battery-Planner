import { PixelRatio, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

export type EmotionItem = { key: string; label: string };

type Props = {
  items: EmotionItem[];
  selected: string[];
  onToggle: (key: string) => void;
};

const MAX_SIZE = 340;
const SCREEN_PADDING = 24; // matches the horizontal padding of the check-in screens
const CHECK = '✓';

// Angle 0 is the top of the wheel, angles grow clockwise.
function point(center: number, angleDeg: number, radius: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: center + radius * Math.cos(a), y: center + radius * Math.sin(a) };
}

function slicePath(center: number, radius: number, startDeg: number, endDeg: number) {
  const s = point(center, startDeg, radius);
  const e = point(center, endDeg, radius);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${center} ${center} L ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y} Z`;
}

export default function EmotionWheel({ items, selected, onToggle }: Props) {
  const { width } = useWindowDimensions();
  // Shrink to fit narrow phones instead of overflowing the screen padding.
  const size = Math.min(MAX_SIZE, width - SCREEN_PADDING * 2);
  const center = size / 2;
  const radius = size * (145 / MAX_SIZE);
  const pop = size * (12 / MAX_SIZE); // how far a selected slice moves outward
  const labelRadius = radius * 0.66;
  // Follow the user's text size setting, capped so labels still fit inside their slice.
  const fontScale = Math.min(PixelRatio.getFontScale(), 1.3);
  const fontSize = 13 * (size / MAX_SIZE) * fontScale;

  const step = 360 / items.length;

  return (
    // Hidden from assistive technology: mood.tsx offers the checkbox list instead,
    // through a "Show as list" button that every input method can reach.
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {items.map((item, i) => {
          const start = i * step;
          const end = (i + 1) * step;
          const mid = start + step / 2;
          const isOn = selected.includes(item.key);
          const offset = isOn ? point(center, mid, pop) : { x: center, y: center };
          const label = point(center, mid, labelRadius);

          return (
            <G
              key={item.key}
              transform={`translate(${offset.x - center} ${offset.y - center})`}
              onPress={() => onToggle(item.key)}
            >
              <Path
                d={slicePath(center, radius, start, end)}
                fill={isOn ? '#101828' : '#F2F4F7'}
                stroke="#344054"
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {/* Check mark, so selection is not shown by colour alone */}
              {isOn && (
                <SvgText
                  x={label.x}
                  y={label.y}
                  dy={-fontSize * 0.9}
                  fontSize={fontSize}
                  fontWeight="700"
                  textAnchor="middle"
                  fill="#FFFFFF"
                >
                  {CHECK}
                </SvgText>
              )}
              <SvgText
                x={label.x}
                y={label.y}
                dy={fontSize * 0.3}
                fontSize={fontSize}
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
