import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, View } from "react-native";
import { AppDialog, AppText } from "../../components";
import { useSettings } from "../../context/SettingsContext";
import { listEventsForDay, type DayEvent } from "../../db/home";
import { makeStyles } from "../../theme/ThemeProvider";
import {
    DRAIN_LABELS,
    drainLevel,
    formatTime,
    totalDrain,
} from "../../utils/drain";

/**
 * Pop-up over the Home screen every time the app is opened (a fresh start, or
 * coming back after it was in the background). It names tomorrow's plans and
 * estimates how much social battery the day may take.
 *
 * Follows Settings → Reminders: hidden when Reminders are off, and the drain
 * estimate is left out when "Tomorrow's estimate" is off.
 */
export function TomorrowReminder() {
  const styles = useStyles();
  const { i18n } = useTranslation();
  const { settings } = useSettings();
  const { enabled, includeDrainEstimate } = settings.reminders;

  // true right after the app opens; cleared once the user closes the pop-up
  const [pending, setPending] = useState(true);
  const [focused, setFocused] = useState(false);
  const [events, setEvents] = useState<DayEvent[] | null>(null);
  const wasInBackground = useRef(false);

  // Only show it while Home is the visible screen.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  // Coming back from the background counts as opening the app again.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background") wasInBackground.current = true;
      if (state === "active" && wasInBackground.current) {
        wasInBackground.current = false;
        setPending(true);
      }
    });
    return () => sub.remove();
  }, []);

  // Load tomorrow's plans each time the pop-up is due.
  useEffect(() => {
    if (!pending) return;
    let cancelled = false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    listEventsForDay(tomorrow)
      .then((list) => {
        if (!cancelled) setEvents(list);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [pending]);

  const close = () => setPending(false);
  const visible = pending && focused && enabled && events !== null;
  const dayDrain = events ? totalDrain(events) : 0;

  return (
    <AppDialog
      visible={visible}
      title="Tomorrow’s plans"
      message={
        events && events.length === 0
          ? "Nothing is planned for tomorrow. It could be a good day to recharge."
          : `You have ${events?.length ?? 0} ${events?.length === 1 ? "plan" : "plans"} tomorrow:`
      }
      primaryLabel="Got it"
      onPrimary={close}
      secondaryLabel="Reminder settings"
      onSecondary={() => {
        close();
        router.push("/profile/settings");
      }}
      onRequestClose={close}
    >
      {events && events.length > 0 ? (
        <View style={styles.list}>
          {events.map((e) => (
            <View
              key={e.id}
              style={styles.row}
              accessible
              accessibilityLabel={`${formatTime(e.startsAtUtc, i18n.language)}, ${e.title}, drain ${DRAIN_LABELS[drainLevel(e.drain)]}`}
            >
              <AppText variant="label" style={styles.time}>
                {formatTime(e.startsAtUtc, i18n.language)}
              </AppText>
              <AppText variant="body" style={styles.title} numberOfLines={2}>
                {e.title}
              </AppText>
              {includeDrainEstimate ? (
                <AppText variant="caption" color="muted">
                  {DRAIN_LABELS[drainLevel(e.drain)]}
                </AppText>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {events && events.length > 0 && includeDrainEstimate ? (
        <View style={styles.estimate}>
          <AppText variant="eyebrow">Estimated drain tomorrow</AppText>
          <AppText variant="heading">
            {`About ${dayDrain}% · ${DRAIN_LABELS[drainLevel(dayDrain)]}`}
          </AppText>
        </View>
      ) : null}
    </AppDialog>
  );
}

const useStyles = makeStyles((t) => ({
  list: { marginTop: t.spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.sm,
    paddingVertical: t.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.line,
  },
  time: { width: 56 },
  title: { flex: 1 },
  estimate: {
    marginTop: t.spacing.md,
    padding: t.spacing.md,
    borderRadius: t.radius.md,
    borderWidth: t.borderWidth,
    borderColor: t.colors.border,
    backgroundColor: t.colors.card,
    gap: t.spacing.xxs,
  },
}));
