import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import InsightsScreen from '@/features/insights/InsightsScreen';

// Until the tab bar exists, Insights is opened from the dev button on the home screen.
// headerTransparent: false keeps the content below the header on iOS 26, where it is see-through by default.
export default function InsightsRoute() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('insights.title'), headerTransparent: false }} />
      <InsightsScreen />
    </>
  );
}
