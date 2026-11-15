import { Stack } from 'expo-router';
import { CheckInDraftProvider } from '@/features/checkin/CheckInDraft';

/**
 * The draft lives here, so it is created when a check-in starts and thrown away when the
 * whole flow is closed. That is also how an abandoned check-in is cleaned up.
 */
export default function CheckInLayout() {
  return (
    <CheckInDraftProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </CheckInDraftProvider>
  );
}
