import { Stack } from 'expo-router';

// Opening a Profile sub-screen from another tab (e.g. the reminder pop-up)
// puts the Profile screen underneath it, so Back and the Profile tab return here.
export const unstable_settings = { anchor: 'index' };

export default function ProfileLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}