// Service layer for the Open-Meteo weather API.
// Screens never call fetch directly; they call the functions in this file.

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const TIMEOUT_MS = 8000;
const CURRENT_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const DAILY_CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes

export type WeatherErrorKind =
  | "network" // no connection
  | "timeout" // took longer than TIMEOUT_MS
  | "rateLimit" // HTTP 429
  | "server" // HTTP 5xx
  | "empty" // answer had no weather data
  | "malformed"; // answer was not what we expected

export class WeatherError extends Error {
  readonly kind: WeatherErrorKind;

  constructor(kind: WeatherErrorKind) {
    super(`Weather error: ${kind}`);
    this.name = "WeatherError";
    this.kind = kind;
  }
}

export type WeatherData = {
  temperature: number; // degrees Celsius
  weatherCode: number; // WMO weather code
  windSpeed: number; // km/h
};

export type DailyForecast = {
  date: string; // YYYY-MM-DD, in the place's own time zone
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  rainChance: number | null; // percent, null if the API has no value
};

type Options = { forceRefresh?: boolean };

// ---------- cache (in memory; resets when the app reloads) ----------

const cache = new Map<string, { savedAt: number; value: unknown }>();

function readCache<T>(key: string, ttlMs: number): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.savedAt > ttlMs) {
    cache.delete(key);
    return null;
  }
  return hit.value as T;
}

function writeCache(key: string, value: unknown): void {
  cache.set(key, { savedAt: Date.now(), value });
}

export function clearWeatherCache(): void {
  cache.clear();
}

function cacheKey(kind: string, latitude: number, longitude: number): string {
  // 2 decimals is roughly 1 km, so nearby points share one cache entry
  return `${kind}:${latitude.toFixed(2)},${longitude.toFixed(2)}`;
}

// ---------- low-level request ----------

function buildUrl(params: Record<string, string | number>): string {
  const query = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return `${FORECAST_URL}?${query}`;
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;
    throw new WeatherError(name === "AbortError" ? "timeout" : "network");
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 429) throw new WeatherError("rateLimit");
  if (response.status >= 500) throw new WeatherError("server");
  if (!response.ok) throw new WeatherError("malformed"); // other 4xx, e.g. bad coordinates

  try {
    return await response.json();
  } catch {
    throw new WeatherError("malformed");
  }
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ---------- public functions ----------

export async function getCurrentWeather(
  latitude: number,
  longitude: number,
  options: Options = {}
): Promise<WeatherData> {
  const key = cacheKey("current", latitude, longitude);
  if (!options.forceRefresh) {
    const cached = readCache<WeatherData>(key, CURRENT_CACHE_TTL_MS);
    if (cached) return cached;
  }

  const data = await fetchJson(
    buildUrl({
      latitude,
      longitude,
      current: "temperature_2m,weather_code,wind_speed_10m",
    })
  );

  if (!isRecord(data)) throw new WeatherError("malformed");
  if (!isRecord(data.current)) throw new WeatherError("empty");

  const { temperature_2m, weather_code, wind_speed_10m } = data.current;
  if (!isNumber(temperature_2m) || !isNumber(weather_code) || !isNumber(wind_speed_10m)) {
    throw new WeatherError("malformed");
  }

  const result: WeatherData = {
    temperature: temperature_2m,
    weatherCode: weather_code,
    windSpeed: wind_speed_10m,
  };
  writeCache(key, result);
  return result;
}

export async function getDailyForecast(
  latitude: number,
  longitude: number,
  days = 7,
  options: Options = {}
): Promise<DailyForecast[]> {
  const key = cacheKey(`daily${days}`, latitude, longitude);
  if (!options.forceRefresh) {
    const cached = readCache<DailyForecast[]>(key, DAILY_CACHE_TTL_MS);
    if (cached) return cached;
  }

  const data = await fetchJson(
    buildUrl({
      latitude,
      longitude,
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      timezone: "auto",
      forecast_days: days,
    })
  );

  if (!isRecord(data)) throw new WeatherError("malformed");
  const daily = data.daily;
  if (!isRecord(daily)) throw new WeatherError("empty");

  const { time, weather_code, temperature_2m_max, temperature_2m_min, precipitation_probability_max } =
    daily;
  if (
    !Array.isArray(time) ||
    !Array.isArray(weather_code) ||
    !Array.isArray(temperature_2m_max) ||
    !Array.isArray(temperature_2m_min)
  ) {
    throw new WeatherError("malformed");
  }
  if (time.length === 0) throw new WeatherError("empty");

  const rain = Array.isArray(precipitation_probability_max) ? precipitation_probability_max : [];

  const result: DailyForecast[] = time.map((date, i) => {
    if (
      typeof date !== "string" ||
      !isNumber(weather_code[i]) ||
      !isNumber(temperature_2m_max[i]) ||
      !isNumber(temperature_2m_min[i])
    ) {
      throw new WeatherError("malformed");
    }
    return {
      date,
      weatherCode: weather_code[i],
      tempMax: temperature_2m_max[i],
      tempMin: temperature_2m_min[i],
      rainChance: isNumber(rain[i]) ? rain[i] : null,
    };
  });

  writeCache(key, result);
  return result;
}