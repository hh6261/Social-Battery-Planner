import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button, StyleSheet, Text, View } from "react-native";


import WeatherCard from "@/components/WeatherCard";
import { changeLocale } from "@/i18n/locale";

export default function Index() {
  const { t } = useTranslation();   // we no longer need i18n here

  return (
    <View style={styles.container}>
      <Text>{t("app.title")}</Text>
      <Text>{t("home.greeting", { name: "Ana" })}</Text>
      <Text>{t("event.count", { count: 3 })}</Text>

      <WeatherCard latitude={45.815} longitude={15.9819} placeName="Zagreb" />

      {/* Temporary test buttons, remove once the settings screen exists */}
      <View style={styles.buttons}>
        <Button title="EN" onPress={() => changeLocale("en")} />
        <Button title="HR" onPress={() => changeLocale("hr")} />
        <Button title="DE" onPress={() => changeLocale("de")} />
      </View>

      {/* Dev-only link, hidden in release builds */}
      {__DEV__ && <Button title="DB viewer" onPress={() => router.push("/dev-db" as Href)} />}
      {__DEV__ && <Button title="Check-in" onPress={() => router.push('/checkin/battery')} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
});
