import { ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { makeStyles } from '@/theme/ThemeProvider';
import BackButton from './BackButton';
import StepProgress from './StepProgress';

type Props = {
  step: number;
  title: string;
  hint?: string;
  children: ReactNode;
  onNext: () => void;
  nextDisabled?: boolean;
  /** If given, a Skip button appears next to Next. */
  onSkip?: () => void;
};

/** Shared frame of the six check-in steps: back link, progress, title, content, Skip / Next. */
export default function StepScreen({ step, title, hint, children, onNext, nextDisabled, onSkip }: Props) {
  const { t } = useTranslation();
  const styles = useStyles();

  const footer = (
    <View style={styles.footer}>
      {onSkip ? (
        <Button variant="outline" label={t('checkin.skip')} onPress={onSkip} style={styles.action} />
      ) : null}
      <Button label={t('checkin.next')} onPress={onNext} disabled={nextDisabled} style={styles.action} />
    </View>
  );

  return (
    <Screen footer={footer}>
      <BackButton />
      <StepProgress current={step} />
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      {hint ? (
        <AppText variant="body" color="muted" style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
      <View style={styles.body}>{children}</View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  hint: { marginTop: t.spacing.xs },
  body: { marginTop: t.spacing.xl, gap: t.spacing.lg },
  footer: { flexDirection: 'row', gap: t.spacing.sm },
  action: { flex: 1 },
}));
