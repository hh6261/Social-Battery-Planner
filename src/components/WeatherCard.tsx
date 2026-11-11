import { useEffect, useState } from "react";
import { ActivityIndicator, Button, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { formatNumber } from "@/i18n/format";
import { weatherCodeToCondition } from "@/services/weatherCodes";
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
    <View style={styles.card} accessibilityLiveRegion="polite">
      <Text style={styles.title} accessibilityRole="header">
        {t("weather.title")}
      </Text>

      {state.status === "loading" && (
        <View style={styles.row} accessible accessibilityLabel={t("weather.loading")}>
          <ActivityIndicator />
          <Text>{t("weather.loading")}</Text>
        </View>
      )}

      {state.status === "error" && (
        <View style={styles.column}>
          <Text accessibilityRole="alert">{t(`weather.error.${state.kind}`)}</Text>
          <Button title={t("weather.retry")} onPress={retry} />
        </View>
      )}

      {state.status === "ready" && (
        <View style={styles.column}>
          <Text style={styles.place}>{placeName}</Text>
          <Text>{t(`weather.condition.${weatherCodeToCondition(state.data.weatherCode)}`)}</Text>
          <Text>
            {t("weather.temperature", { value: formatNumber(round(state.data.temperature)) })}
          </Text>
          <Text>{t("weather.wind", { value: formatNumber(round(state.data.windSpeed)) })}</Text>
        </View>
      )}

      <Text style={styles.attribution}>{t("weather.attribution")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    marginHorizontal: 24,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#999",
    gap: 8,
  },
  title: { fontSize: 18, fontWeight: "600" },
  place: { fontSize: 16, fontWeight: "500" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  column: { gap: 4 },
  attribution: { fontSize: 12, opacity: 0.7 },
});