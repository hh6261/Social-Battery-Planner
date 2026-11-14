import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { formatNumber } from "@/i18n/format";
import { weatherCodeToCondition } from "@/services/weatherCodes";
import { makeStyles, useTheme } from "@/theme/ThemeProvider";
import {
  getCurrentWeather,
  WeatherData,
  WeatherError,
  WeatherErrorKind,
} from "@/services/weatherService";

type Props = {
  latitude: number;
  longitude: number;
  placeName: string;
};

type State =
  | { status: "loading" }
  | { status: "error"; kind: WeatherErrorKind }
  | { status: "ready"; data: WeatherData };

// Math.round(-0.4) is -0, which Intl would print as "-0"
const round = (n: number) => Math.round(n) || 0;

const toKind = (error: unknown): WeatherErrorKind =>
  error instanceof WeatherError ? error.kind : "malformed";

export default function WeatherCard({ latitude, longitude, placeName }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0); // goes up by 1 each time the user taps "Try again"

  // The state starts as "loading", so the effect only sets state after the
  // request finishes. If the coordinates can change while the card is shown,
  // give it a key (key={`${lat},${lon}`}) so it remounts and loads again.
  useEffect(() => {
    let cancelled = false;
    getCurrentWeather(latitude, longitude, { forceRefresh: attempt > 0 })
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: "error", kind: toKind(error) });
      });
    return () => {
      cancelled = true; // ignore an answer that arrives after the screen is gone
    };
  }, [latitude, longitude, attempt]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1); // forceRefresh skips the cache
  };

  return (
    <Card style={styles.card}>
      <View accessibilityLiveRegion="polite" style={styles.column}>
        <AppText variant="subheading" accessibilityRole="header">
          {t("weather.title")}
        </AppText>

        {state.status === "loading" && (
          <View style={styles.row} accessible accessibilityLabel={t("weather.loading")}>
            <ActivityIndicator color={theme.colors.ink} />
            <AppText>{t("weather.loading")}</AppText>
          </View>
        )}

        {state.status === "error" && (
          <View style={styles.column}>
            <AppText accessibilityRole="alert">{t(`weather.error.${state.kind}`)}</AppText>
            <Button label={t("weather.retry")} variant="outline" size="md" onPress={retry} />
          </View>
        )}

        {state.status === "ready" && (
          <View style={styles.column}>
            <AppText variant="label">{placeName}</AppText>
            <AppText>{t(`weather.condition.${weatherCodeToCondition(state.data.weatherCode)}`)}</AppText>
            <AppText>
              {t("weather.temperature", { value: formatNumber(round(state.data.temperature)) })}
            </AppText>
            <AppText>{t("weather.wind", { value: formatNumber(round(state.data.windSpeed)) })}</AppText>
          </View>
        )}

        <AppText variant="caption" color="muted">
          {t("weather.attribution")}
        </AppText>
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { alignSelf: "stretch", marginHorizontal: t.spacing.xl, marginTop: t.spacing.xl },
  row: { flexDirection: "row", alignItems: "center", gap: t.spacing.xs },
  column: { gap: t.spacing.xxs },
}));
