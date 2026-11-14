import React from 'react';
import { View } from 'react-native';
import { AppText, Button, Logo, Screen } from '../../components';
import { router } from 'expo-router';
import { makeStyles } from '../../theme/ThemeProvider';

/** Screen 1 · Splash / Welcome */
export function SplashScreen() {
  const styles = useStyles();

  return (
    <Screen
      contentStyle={styles.content}
      footer={
        <View>
          <Button label="Create my account" onPress={() => router.push('/register')} />
          <View style={styles.loginRow}>
            <AppText variant="body" color="muted">
              Already keeping track?{' '}
            </AppText>
            <AppText
              variant="body"
              weight="600"
              style={styles.link}
              onPress={() => router.push('/login')}
              accessibilityRole="link"
              accessibilityLabel="Log in"
              suppressHighlighting={false}
            >
              Log in
            </AppText>
          </View>
        </View>
      }
    >
      <View style={styles.hero}>
        <Logo size={128} badges />
        <AppText variant="eyebrow" color="ink" style={styles.brand}>
          Social Battery
        </AppText>
        <AppText variant="display" align="center" accessibilityRole="header">
          Make space for the moments that matter
        </AppText>
        <AppText variant="body" color="muted" align="center" style={styles.tagline}>
          Gently track your energy, plan for social time, and find room to recharge.
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
