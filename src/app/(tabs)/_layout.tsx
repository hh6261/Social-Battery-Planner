import { Tabs } from 'expo-router';
import { TabBar } from '@/navigation/TabBar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tracker" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="profile" options={{ popToTopOnBlur: true }} />
    </Tabs>
  );
}