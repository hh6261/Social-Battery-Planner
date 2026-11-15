import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Segmented } from '@/components/Segmented';
import { makeStyles } from '@/theme/ThemeProvider';

import DayView from './DayView';
import PatternsView from './PatternsView';
import WeekView from './WeekView';

type Segment = 'day' | 'week' | 'patterns';
const SEGMENTS: Segment[] = ['day', 'week', 'patterns'];

/**
 * Insights (merged screens 20, 21 and 22, Roko's wireframes 01 to 03): the Day / Week /
 * Patterns switch changes between the Daily Timeline, the Weekly Overview and Patterns.
 */
export default function InsightsScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const [segment, setSegment] = useState<Segment>('day');

  return (
    <View style={styles.screen}>
      <Segmented
        role="tab"
        value={segment}
        onChange={setSegment}
        style={styles.segments}
        options={SEGMENTS.map((s) => ({
          key: s,
          label: s === 'patterns' ? t('patterns.title') : t(`insights.segment.${s}`),
        }))}
      />
      {segment === 'day' && <DayView />}
      {segment === 'week' && <WeekView />}
      {segment === 'patterns' && <PatternsView />}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  segments: { marginHorizontal: t.spacing.xl, marginTop: t.spacing.md },
}));
