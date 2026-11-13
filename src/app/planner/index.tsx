import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import PlanAheadScreen from '@/features/planner/PlanAheadScreen';

// Until the tab bar exists, Plan Ahead is opened from the dev button on the home screen.
// Later the Journal tab shows it as its "Plan" segment.
// headerTransparent: false keeps the content below the header on iOS 26, where it is see-through by default.
export default function PlanAheadRoute() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('planner.title'), headerTransparent: false }} />
      <PlanAheadScreen />
    </>
  );
}
