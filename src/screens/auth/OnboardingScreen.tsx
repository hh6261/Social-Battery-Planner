import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  View,
} from 'react-native';
import { AppText, Button, Card, DashedBox, Logo, Screen } from '../../components';
import { router } from 'expo-router';
import { makeStyles } from '../../theme/ThemeProvider';

interface Slide {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  sampleLabel: string;
  sampleValue: string;
}

/**
 * Slide 1 is from the wireframe. Slides 2–3 follow the same pattern for the
 * Journal (plan ahead) and Insights (recharge) parts of the app.
 */
const SLIDES: Slide[] = [
  {
    key: 'check-in',
    eyebrow: 'Check in',
    title: 'Notice how your energy feels',
    body: 'A quick check-in can help you understand which moments feel energizing and which may need more recovery time.',
    sampleLabel: 'Today’s check-in',
    sampleValue: 'Social battery: steady · 6 out of 10',
  },
  {
    key: 'plan',
    eyebrow: 'Plan ahead',
    title: 'See busy days coming',
    body: 'Add plans to your journal and get a sense of how much energy each one may take, so you can leave room around them.',
    sampleLabel: 'Tomorrow',
    sampleValue: 'Team lunch · Drain: moderate',
  },
  {
    key: 'recharge',
    eyebrow: 'Recharge',
    title: 'Find what helps you recover',
    body: 'Over time, insights show your patterns and suggest gentle ways to recharge when your battery runs low.',
    sampleLabel: 'Suggestion',
    sampleValue: 'A short walk after your afternoon meeting',
  },
];

/** Screen 4 · Onboarding */
export function OnboardingScreen() {
  const styles = useStyles();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const goTo = useCallback(
    (i: number) => {
      setIndex(i);
      listRef.current?.scrollToOffset({ offset: i * width, animated: true });
    },
    [width],
  );

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== width) setWidth(w);
  };

  const next = () => (isLast ? router.push('/personalize') : goTo(index + 1));

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button
            label="Skip"
            variant="outline"
            onPress={() => router.push('/personalize')}
            accessibilityHint="Skips the introduction"
            style={styles.footerButton}
          />
          <Button
            label={isLast ? 'Continue' : 'Next'}
            onPress={next}
            style={styles.footerButton}
          />
        </View>
      }
    >
      <View style={styles.header}>
        <Logo size={56} />
        <AppText variant="eyebrow" color="ink" style={styles.brand}>
          Social Battery
        </AppText>
        <AppText variant="title" align="center" accessibilityRole="header">
          Make a little more room for your energy
        </AppText>
      </View>

      <Card flush contentStyle={styles.carouselCard}>
        <View style={styles.dots} accessibilityRole="tablist">
          {SLIDES.map((s, i) => (
            <Pressable
              key={s.key}
              onPress={() => goTo(i)}
              hitSlop={8}
              accessibilityRole="tab"
              accessibilityState={{ selected: i === index }}
              accessibilityLabel={`Slide ${i + 1} of ${SLIDES.length}: ${s.eyebrow}`}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>

        <View onLayout={onLayout}>
          {width > 0 && (
            <FlatList
              ref={listRef}
              data={SLIDES}
              keyExtractor={(s) => s.key}
              horizontal
              pagingEnabled
              bounces={false}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onScrollEnd}
              getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
              renderItem={({ item }) => (
                <View style={[styles.slide, { width }]} accessible accessibilityLabel={`${item.eyebrow}. ${item.title}. ${item.body}`}>
                  <AppText variant="eyebrow">{item.eyebrow}</AppText>
                  <AppText variant="heading" style={styles.slideTitle}>
                    {item.title}
                  </AppText>
                  <AppText variant="body" color="muted" style={styles.slideBody}>
                    {item.body}
                  </AppText>
                  <DashedBox style={styles.sample}>
                    <AppText variant="eyebrow">{item.sampleLabel}</AppText>
                    <AppText variant="label" style={styles.sampleValue}>
                      {item.sampleValue}
                    </AppText>
                  </DashedBox>
                </View>
              )}
            />
          )}
        </View>

        <AppText variant="caption" color="muted" align="center" style={styles.hint}>
          Swipe the card or choose a dot to explore
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
