import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import '../i18n';
import { initDatabase } from '../db/client';
import { loadSavedLocale } from '../i18n/locale';

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

  return <Stack />;
}