import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import RechargeScreen from '@/features/recharge/RechargeScreen';

// Opened from Patterns and from the low-battery screen (15): router.push('/recharge')
// headerTransparent: false keeps the content below the header on iOS 26, where it is see-through by default.
export default function RechargeRoute() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('recharge.title'), headerTransparent: false }} />
      <RechargeScreen />
    </>
  );
}
