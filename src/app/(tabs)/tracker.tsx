import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Segmented } from '@/components/Segmented';
import DailyLog from '@/features/checkin/DailyLog';
import PlanAheadScreen from '@/features/planner/PlanAheadScreen';
import { makeStyles } from '@/theme/ThemeProvider';

type Tab = 'log' | 'plan';

/**
 * Tracker (Journal) tab: a Log | Plan switch. Log is the daily log (16),
 * Plan is the team's Plan Ahead screen. Open the Plan side directly with /tracker?tab=plan.
 */
export default function TrackerTab() {
  const { t } = useTranslation();
  const styles = useStyles();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'plan' ? 'plan' : 'log');

  // Follow a new ?tab= value when the tab is opened again from somewhere else.
  const [seen, setSeen] = useState(params.tab);
  if (params.tab !== seen) {
    setSeen(params.tab);
    if (params.tab === 'plan' || params.tab === 'log') setTab(params.tab);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.switch}>
        <Segmented
          role="tab"
          value={tab}
          onChange={setTab}
          options={[
            { key: 'log', label: t('checkin.log.tabLog') },
            { key: 'plan', label: t('checkin.log.tabPlan') },
          ]}
        />
      </View>

      {tab === 'plan' ? (
        <View style={styles.flex}>
          <PlanAheadScreen />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <DailyLog />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  switch: { paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.md, paddingBottom: t.spacing.sm },
  content: { paddingHorizontal: t.spacing.xl, paddingBottom: t.spacing.xxl },
}));
