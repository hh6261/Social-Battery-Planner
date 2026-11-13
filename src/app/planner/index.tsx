import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import PlanAheadScreen from '@/features/planner/PlanAheadScreen';

// Until the tab bar exists, Plan Ahead is opened from the dev button on the home screen.
// Later the Journal tab shows it as its "Plan" segment.
export default function PlanAheadRoute() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('planner.title') }} />
      <PlanAheadScreen />
    </>
  );
}
