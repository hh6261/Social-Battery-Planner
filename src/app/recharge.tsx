import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import RechargeScreen from '@/features/recharge/RechargeScreen';

// Opened from Patterns and from the low-battery screen (15): router.push('/recharge')
export default function RechargeRoute() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('recharge.title') }} />
      <RechargeScreen />
    </>
  );
}
