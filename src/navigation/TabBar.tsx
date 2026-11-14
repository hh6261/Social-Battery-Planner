import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/tabs';
import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { HardShadow } from '../components/HardShadow';
import { TAB_LABELS } from '../constants/config';
import { makeStyles, useTheme } from '../theme/ThemeProvider';

type TabName = 'index' | 'tracker' | 'insights' | 'profile';

/** Tabs that contain more than one screen, and the path of their first screen. */
const STACK_ROOTS: Partial<Record<TabName, '/profile'>> = { profile: '/profile' };

const TABS: Record<TabName, { label: string; icon: (color: string) => React.ReactNode }> = {
  index: { label: TAB_LABELS.home, icon: (c) => <Ionicons name="heart" size={22} color={c} /> },
  tracker: { label: TAB_LABELS.tracker, icon: (c) => <Feather name="file-text" size={21} color={c} /> },
  insights: { label: TAB_LABELS.insights, icon: (c) => <Feather name="sliders" size={20} color={c} /> },
  profile: { label: TAB_LABELS.profile, icon: (c) => <Feather name="user" size={21} color={c} /> },
};

/**
 * Floating navbar from the wireframes: outlined rounded bar, active tab is a
 * dark pill. Follows React Navigation's custom tab bar contract, so:
 *  - tapping another tab switches to it (keeping that tab's history)
 *  - tapping the active tab pops its stack back to the top (e.g. Settings → Profile)
 *  - long press emits tabLongPress for anyone who wants it
 */
export function TabBar({ state, emitter, navigateToTab, descriptors }: BottomTabBarProps) {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();

  // Let a screen hide the bar with options={{ tabBarStyle: { display: 'none' } }}
  const focusedOptions = descriptors[state.routes[state.index].key].options;
  const hiddenByScreen = (focusedOptions.tabBarStyle as { display?: string } | undefined)?.display === 'none';
  if (keyboardVisible || hiddenByScreen) return null;

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }]}>
      <HardShadow radius={theme.radius.xl}>
        <View style={styles.bar} accessibilityRole="tablist">
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const tab = TABS[route.name as TabName];
            const color = focused ? theme.colors.onPrimary : theme.colors.ink;

            
            const onPress = () => {
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (event.defaultPrevented) return;
              if (!focused) {
                navigateToTab(route.key);
              } else if (STACK_ROOTS[route.name as TabName]) {
                // Already on this tab: go back to its first screen (e.g. Settings → Profile).
                router.dismissTo(STACK_ROOTS[route.name as TabName]!);
              }
            };
            const onLongPress = () => 	emitter.emit({ type: 'tabLongPress', target: route.key });

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={tab.label}
                testID={`tab-${route.name}`}
                style={({ pressed }) => [styles.item, focused && styles.itemActive, pressed && !focused && styles.pressed]}
              >
                {tab.icon(color)}
                <AppText
                  variant="caption"
                  weight="700"
                  style={[styles.label, { color }]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.2}
                >
                  {tab.label.toUpperCase()}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </HardShadow>
    </View>
  );
}

/** Android resizes the window for the keyboard, which would push the bar up. */
function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

const useStyles = makeStyles((t) => ({
  outer: {
    paddingHorizontal: t.spacing.md,
    paddingTop: t.spacing.xs,
    backgroundColor: t.colors.background,
  },
  bar: {
    flexDirection: 'row',
    borderWidth: t.borderWidth,
    borderColor: t.colors.border,
    borderRadius: t.radius.xl,
    backgroundColor: t.colors.surface,
    padding: 6,
    gap: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
    borderRadius: t.radius.lg,
    paddingVertical: 6,
  },
  itemActive: { backgroundColor: t.colors.primary },
  pressed: { backgroundColor: t.colors.secondary },
  label: { marginTop: 4, fontSize: 10, letterSpacing: 0.8, lineHeight: 12 },
}));
