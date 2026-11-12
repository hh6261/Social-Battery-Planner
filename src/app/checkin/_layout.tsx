import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CheckInDraftProvider } from '@/features/checkin/CheckInDraft';

export default function CheckInLayout() {
  const { t } = useTranslation();
  return (
    <CheckInDraftProvider>
      <Stack screenOptions={{ title: t('checkin.title') }} />
    </CheckInDraftProvider>
  );
}