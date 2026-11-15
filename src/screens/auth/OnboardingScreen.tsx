import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, DashedBox, Logo, Screen } from '../../components';
import { router } from 'expo-router';
import { makeStyles } from '../../theme/ThemeProvider';

/**
 * Slide 1 is from the wireframe. Slides 2–3 follow the same pattern for the
 * Journal (plan ahead) and Insights (recharge) parts of the app.
 * The texts live in the locale files under onboarding.<key>.*
 */
const SLIDE_KEYS = ['checkIn', 'plan', 'recharge'] as const;

/**
 * Screen 4 · Onboarding.
 * One slide is shown at a time and changed with Next or the dots. (There is no swiping, so the
 * screen behaves the same in left-to-right and right-to-left languages.)
 */
export function OnboardingScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDE_KEYS.length - 1;
  const key = SLIDE_KEYS[index];

  const eyebrow = t(`onboarding.${key}.eyebrow`);
  const title = t(`onboarding.${key}.title`);
  const body = t(`onboarding.${key}.body`);

  const next = () => (isLast ? router.push('/personalize') : setIndex(index + 1));

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button
            label={t('common.skip')}
            variant="outline"
            onPress={() => router.push('/personalize')}
            accessibilityHint={t('onboarding.skipHint')}
            style={styles.footerButton}
          />
          <Button label={isLast ? t('common.continue') : t('common.next')} onPress={next} style={styles.footerButton} />
        </View>
      }
    >
      <View style={styles.header}>
        <Logo size={56} />
        <AppText variant="eyebrow" color="ink" style={styles.brand}>
          {t('app.name')}
        </AppText>
        <AppText variant="title" align="center" accessibilityRole="header">
          {t('onboarding.title')}
        </AppText>
      </View>

      <Card flush contentStyle={styles.carouselCard}>
        <View style={styles.dots} accessibilityRole="tablist">
          {SLIDE_KEYS.map((k, i) => (
            <Pressable
              key={k}
              onPress={() => setIndex(i)}
              hitSlop={8}
              accessibilityRole="tab"
              accessibilityState={{ selected: i === index }}
              accessibilityLabel={t('onboarding.slideLabel', {
                number: i + 1,
                total: SLIDE_KEYS.length,
                name: t(`onboarding.${k}.eyebrow`),
              })}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.slide} accessible accessibilityLabel={`${eyebrow}. ${title}. ${body}`}>
          <AppText variant="eyebrow">{eyebrow}</AppText>
          <AppText variant="heading" style={styles.slideTitle}>
            {title}
          </AppText>
          <AppText variant="body" color="muted" style={styles.slideBody}>
            {body}
          </AppText>
          <DashedBox style={styles.sample}>
            <AppText variant="eyebrow">{t(`onboarding.${key}.sampleLabel`)}</AppText>
            <AppText variant="label" style={styles.sampleValue}>
              {t(`onboarding.${key}.sampleValue`)}
            </AppText>
          </DashedBox>
        </View>

        <AppText variant="caption" color="muted" align="center" style={styles.hint}>
          {t('onboarding.hint')}
        </AppText>
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: { alignItems: 'center', marginTop: t.spacing.md, marginBottom: t.spacing.xl },
  brand: { marginTop: t.spacing.md, marginBottom: t.spacing.xs, letterSpacing: 3 },
  carouselCard: { paddingVertical: t.spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: t.spacing.md },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: t.colors.ink,
  },
  dotActive: { width: 26, backgroundColor: t.colors.ink },
  slide: { paddingHorizontal: t.spacing.lg },
  slideTitle: { marginTop: t.spacing.xs },
  slideBody: { marginTop: t.spacing.sm },
  sample: { marginTop: t.spacing.lg },
  sampleValue: { marginTop: t.spacing.xxs },
  hint: { marginTop: t.spacing.lg, paddingHorizontal: t.spacing.lg },
  footer: { flexDirection: 'row', gap: t.spacing.sm },
  footerButton: { flex: 1 },
}));
