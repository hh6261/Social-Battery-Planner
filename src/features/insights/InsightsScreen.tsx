import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, minTouchSize, spacing } from '@/theme/colors';

import DayView from './DayView';
import WeekView from './WeekView';

type Segment = 'day' | 'week';
const SEGMENTS: Segment[] = ['day', 'week'];

/**
 * Insights (merged screens 20 and 21, Roko's wireframes 01 and 02): the Day / Week
 * buttons switch between the Daily Timeline and the Weekly Overview.
 * Patterns (screen 22) will be added as a third button.
 */
export default function InsightsScreen() {
  const { t } = useTranslation();
  const [segment, setSegment] = useState<Segment>('day');

  return (
    <View style={styles.screen}>
      <View style={styles.segments} accessibilityRole="tablist">
        {SEGMENTS.map((s) => {
          const selected = s === segment;
          return (
            <Pressable
              key={s}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setSegment(s)}
              style={[styles.segment, selected && styles.segmentSelected]}
            >
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                {t(`insights.segment.${s}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {segment === 'day' ? <DayView /> : <WeekView />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  segments: {
    flexDirection: 'row',
    margin: spacing.lg,
    marginBottom: 0,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  segment: { flex: 1, minHeight: minTouchSize, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { backgroundColor: colors.primary },
  segmentText: { fontSize: 16, color: colors.text, fontWeight: '600' },
  segmentTextSelected: { color: colors.onPrimary },
});
