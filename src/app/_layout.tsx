import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Stack } from 'expo-router';
import { initDatabase } from '../db/client';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((e) => console.error('DB failed to start', e));
  }, []);

  if (!dbReady) return <Text>Loading…</Text>;

  return <Stack />;
}