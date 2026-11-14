import React from 'react';
import { View } from 'react-native';
import { AppText, Card, Screen } from '../components';
import { makeStyles } from '../theme/ThemeProvider';

/**
 * Stand-in for tabs owned by other groups, so the navbar works end to end.
 * Replace the component in RootNavigator → MainTabs with the real screen.
 */
export function PlaceholderScreen({ title, owner }: { title: string; owner: string }) {
  const styles = useStyles();
  return (
    <Screen edges={['top']}>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      <View style={styles.spacer} />
      <Card>
        <AppText variant="eyebrow">Placeholder</AppText>
        <AppText variant="body" style={styles.body}>
          {owner} screens are being built separately. The navbar is already wired to this tab, so they
          can drop their screen in without touching navigation.
        </AppText>
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  spacer: { height: t.spacing.lg },
  body: { marginTop: t.spacing.xs },
}));
