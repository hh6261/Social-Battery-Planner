# Weather in the check-in

Each new check-in records the weather at the moment it is saved, so the daily log shows the weather of every day.

- On the confirmation screen (`src/app/checkin/confirm.tsx`) the hook `useCheckInWeather`
  (`src/features/checkin/useCheckInWeather.ts`) asks Open-Meteo for the current weather of `DEFAULT_CITY`
  (Zagreb, `src/features/planner/cities.ts`) through `getCurrentWeather` in `src/services/weatherService.ts`.
  Results are cached for 15 minutes by the service.
- The weather is shown as a row under the summary. If there is no internet the check-in is still saved, without weather.
- Migration `008_checkin_weather.ts` adds three nullable columns to `check_in`:

| Column | Type | Meaning |
| --- | --- | --- |
| `weather_code` | INTEGER (0-99) | WMO weather code from Open-Meteo |
| `weather_temp` | REAL | temperature in degrees Celsius (rounded) |
| `weather_city` | TEXT | city name the weather was read for |

- The text ("Partly cloudy") is not stored. It is translated when shown, with `weather.condition.*` in the locale files.
- Edited check-ins keep the weather they were saved with.
- The daily log (`src/features/checkin/DailyLog.tsx`) shows the condition and temperature under each entry.
