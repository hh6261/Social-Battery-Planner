// Maps Open-Meteo's WMO weather codes to a translation key suffix.
// The text itself lives in the locale files under weather.condition.*

export type WeatherCondition =
  | "clear"
  | "partlyCloudy"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "showers"
  | "snow"
  | "thunderstorm"
  | "unknown";

export function weatherCodeToCondition(code: number): WeatherCondition {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partlyCloudy";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "showers";
  if (code === 85 || code === 86) return "snow";
  if (code >= 95 && code <= 99) return "thunderstorm";
  return "unknown";
}