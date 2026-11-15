import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Card, Screen } from '../components';
import { makeStyles } from '../theme/ThemeProvider';

/**
 * Stand-in for tabs owned by other groups, so the navbar works end to end.
 * Replace the component in RootNavigator → MainTabs with the real screen.
 */
export function PlaceholderScreen({ title, owner }: { title: string; owner: string }) {
  const { t } = useTranslation();
  const styles = useStyles();
  return (
    <Screen edges={['top']}>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      <View style={styles.spacer} />
      <Card>
        <AppText variant="eyebrow">{t('placeholder.label')}</AppText>
        <AppText variant="body" style={styles.body}>
          {t('placeholder.body', { owner })}
        </AppText>
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  spacer: { height: t.spacing.lg },
  body: { marginTop: t.spacing.xs },
}));
