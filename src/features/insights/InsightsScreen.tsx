import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, minTouchSize, spacing } from '@/theme/colors';

import DayView from './DayView';
import PatternsView from './PatternsView';
import WeekView from './WeekView';

type Segment = 'day' | 'week' | 'patterns';
const SEGMENTS: Segment[] = ['day', 'week', 'patterns'];

/**
 * Insights (merged screens 20, 21 and 22, Roko's wireframes 01 to 03): the Day / Week /
 * Patterns buttons switch between the Daily Timeline, the Weekly Overview and Patterns.
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
                {s === 'patterns' ? t('patterns.title') : t(`insights.segment.${s}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {segment === 'day' && <DayView />}
      {segment === 'week' && <WeekView />}
      {segment === 'patterns' && <PatternsView />}
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
