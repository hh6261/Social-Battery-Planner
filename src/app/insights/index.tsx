import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import InsightsScreen from '@/features/insights/InsightsScreen';

// Until the tab bar exists, Insights is opened from the dev button on the home screen.
export default function InsightsRoute() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('insights.title') }} />
      <InsightsScreen />
    </>
  );
}
