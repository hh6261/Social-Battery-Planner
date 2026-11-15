import { useCallback, useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { router, Stack, useFocusEffect, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useDialog } from '@/components/DialogProvider';
import { Screen } from '@/components/Screen';
import { listRechargeActivities } from '@/db/recharge';
import type { RechargeActivity } from '@/db/types';
import { makeStyles } from '@/theme/ThemeProvider';

// Screen 26 (Let someone know) does not exist yet. Put its route here, e.g. '/notify'.
// While it is null the button shows a "coming soon" message instead of crashing.
const LET_SOMEONE_KNOW_ROUTE: string | null = null;

const MAX_SUGGESTIONS = 6;

/** Screen 15. Shown after saving a check-in with a low battery. */
export default function LowBatteryScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const { showMessage } = useDialog();
  const [ideas, setIdeas] = useState<RechargeActivity[] | null>(null);

  // Suggestions are the user's own Recharge list (screen 25).
  useEffect(() => {
    let cancelled = false;
    listRechargeActivities()
      .then((list) => {
        if (!cancelled) setIdeas(list.slice(0, MAX_SUGGESTIONS));
      })
      .catch(() => {
        if (!cancelled) setIdeas([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const proceed = useCallback(() => {
    router.dismissTo('/tracker'); // the daily log
  }, []);

  // The check-in is already saved, so Back goes to the daily log, not into the check-in steps.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        proceed();
        return true;
      });
      return () => sub.remove();
    }, [proceed])
  );

  const nameOf = (a: RechargeActivity) => (a.key ? t(`recharge.defaults.${a.key}`) : (a.name ?? ''));

  const letKnow = () => {
    if (LET_SOMEONE_KNOW_ROUTE) router.push(LET_SOMEONE_KNOW_ROUTE as Href);
    else void showMessage(t('checkin.lowBattery.soonTitle'), t('checkin.lowBattery.soon'));
  };

  const footer = <Button label={t('checkin.lowBattery.proceed')} onPress={proceed} />;

  return (
    <Screen footer={footer}>
      <Stack.Screen options={{ gestureEnabled: false }} />

      <Card style={styles.card}>
        <AppText variant="title" accessibilityRole="header">
          {t('checkin.lowBattery.title')}
        </AppText>
      </Card>

      <AppText variant="eyebrow" accessibilityRole="header">
        {t('checkin.lowBattery.suggested')}
      </AppText>

      {ideas === null ? (
        <AppText color="muted" style={styles.gap}>
          {t('app.loading')}
        </AppText>
      ) : ideas.length === 0 ? (
        <AppText color="muted" style={styles.gap}>
          {t('checkin.lowBattery.noIdeas')}
        </AppText>
      ) : (
        <View style={styles.grid} accessibilityRole="list">
          {ideas.map((a) => (
            <View key={a.id} style={styles.idea} accessible accessibilityRole="text">
              <AppText variant="subheading" align="center">
                {nameOf(a)}
              </AppText>
              <AppText variant="caption" color="muted" align="center">
                {t('checkin.lowBattery.minutes', { count: a.minutes })}
              </AppText>
            </View>
          ))}
        </View>
      )}

      <View style={styles.links}>
        <Button
          variant="outline"
          size="md"
          label={t('checkin.lowBattery.seeAll')}
          onPress={() => router.push('/recharge')}
          style={styles.link}
        />
        <Button
          variant="outline"
          size="md"
          label={t('checkin.lowBattery.letKnow')}
          onPress={letKnow}
          style={styles.link}
        />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  card: { marginBottom: t.spacing.xl },
  gap: { marginTop: t.spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm, marginTop: t.spacing.sm },
  idea: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 100,
    minHeight: 80,
    padding: t.spacing.sm,
    gap: t.spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.lg,
    borderWidth: t.borderWidth,
    borderColor: t.colors.border,
    backgroundColor: t.colors.card,
  },
  links: { flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.xl },
  link: { flex: 1 },
}));
