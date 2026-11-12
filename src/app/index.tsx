import { useTranslation } from "react-i18next";
import { Button, StyleSheet, Text, View } from "react-native";

import WeatherCard from "@/components/WeatherCard";

export default function Index() {
  const { t, i18n } = useTranslation();

  return (
    <View style={styles.container}>
      <Text>{t("app.title")}</Text>
      <Text>{t("home.greeting", { name: "Ana" })}</Text>
      <Text>{t("event.count", { count: 3 })}</Text>

      <WeatherCard latitude={45.815} longitude={15.9819} placeName="Zagreb" />

      {/* Temporary test buttons, remove once the settings screen exists */}
      <View style={styles.buttons}>
        <Button title="EN" onPress={() => i18n.changeLanguage("en")} />
        <Button title="HR" onPress={() => i18n.changeLanguage("hr")} />
        <Button title="DE" onPress={() => i18n.changeLanguage("de")} />
      </View>
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
