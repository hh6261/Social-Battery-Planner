import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import '../i18n';
import { initDatabase } from '../db/client';
import { loadSavedLocale } from '../i18n/locale';
import { DialogProvider } from '../components/DialogProvider';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SettingsProvider } from '../context/SettingsContext';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';

export default function RootLayout() {
  const { t } = useTranslation();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(loadSavedLocale)
      .then(() => setDbReady(true))
      .catch((e) => console.error('DB failed to start', e));
  }, []);

  if (!dbReady) return <Text>{t('app.loading')}</Text>;

  return (
    <AuthProvider>
      <SettingsProvider>
        <ThemeProvider>
          <DialogProvider>
            <RootStack />
          </DialogProvider>
        </ThemeProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

function RootStack() {
  const { status } = useAuth();
  const theme = useTheme();

  if (status === 'loading') return null;

  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          // Screens that show a header (Plan ahead, Insights, Recharge) use the app colours too.
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.ink,
          headerTitleStyle: { color: theme.colors.ink, fontWeight: '700' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        <Stack.Protected guard={status === 'onboarding'}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>

        <Stack.Protected guard={status === 'signedIn'}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="checkin" />
          <Stack.Screen name="low-battery" options={{ gestureEnabled: false }} />
          <Stack.Screen
            name="checkin-options"
            options={{ presentation: 'transparentModal', animation: 'fade' }}
          />
          <Stack.Screen name="planner/index" options={{ headerShown: true }} />
          <Stack.Screen name="planner/event" options={{ headerShown: true }} />
          <Stack.Screen name="insights/index" options={{ headerShown: true }} />
          <Stack.Screen name="recharge" options={{ headerShown: true }} />
          <Stack.Screen name="dev-db" options={{ headerShown: true }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}