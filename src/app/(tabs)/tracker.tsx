import { SafeAreaView } from 'react-native-safe-area-context';
import PlanAheadScreen from '@/features/planner/PlanAheadScreen';

// Tracker tab shows the team's Plan Ahead screen. It normally sits under a
// header, so the safe area keeps it clear of the status bar here.
export default function TrackerTab() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <PlanAheadScreen />
    </SafeAreaView>
  );
}