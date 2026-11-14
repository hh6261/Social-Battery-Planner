import { SafeAreaView } from 'react-native-safe-area-context';
import InsightsScreen from '@/features/insights/InsightsScreen';

// Insights tab shows the team's Insights screen. It normally sits under a
// header, so the safe area keeps it clear of the status bar here.
export default function InsightsTab() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <InsightsScreen />
    </SafeAreaView>
  );
}