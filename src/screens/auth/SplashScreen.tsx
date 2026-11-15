import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Logo, Screen } from '../../components';
import { router } from 'expo-router';
import { makeStyles } from '../../theme/ThemeProvider';

/** Screen 1 · Splash / Welcome */
export function SplashScreen() {
  const { t } = useTranslation();
  const styles = useStyles();

  return (
    <Screen
      contentStyle={styles.content}
      footer={
        <View>
          <Button label={t('splash.create')} onPress={() => router.push('/register')} />
          <View style={styles.loginRow}>
            <AppText variant="body" color="muted">
              {t('splash.already')}{' '}
            </AppText>
            <AppText
              variant="body"
              weight="600"
              style={styles.link}
              onPress={() => router.push('/login')}
              accessibilityRole="link"
              accessibilityLabel={t('auth.logIn')}
              suppressHighlighting={false}
            >
              {t('auth.logIn')}
            </AppText>
          </View>
        </View>
      }
    >
      <View style={styles.hero}>
        <Logo size={128} badges />
        <AppText variant="eyebrow" color="ink" style={styles.brand}>
          {t('app.name')}
        </AppText>
        <AppText variant="display" align="center" accessibilityRole="header">
          {t('splash.title')}
        </AppText>
        <AppText variant="body" color="muted" align="center" style={styles.tagline}>
          {t('splash.tagline')}
        </AppText>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  content: { flexGrow: 1, justifyContent: 'center' },
  hero: { alignItems: 'center', paddingVertical: t.spacing.xxl },
  brand: { marginTop: t.spacing.xxl, marginBottom: t.spacing.md, letterSpacing: 4 },
  tagline: { marginTop: t.spacing.md, maxWidth: 320, fontSize: t.font(17), lineHeight: t.font(26) },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: t.spacing.lg,
    marginBottom: t.spacing.xs,
    flexWrap: 'wrap',
  },
  link: { textDecorationLine: 'underline', paddingVertical: t.spacing.xs },
}));
