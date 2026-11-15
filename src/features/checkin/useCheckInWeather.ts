import { useEffect, useState } from 'react';

import { DEFAULT_CITY } from '@/features/planner/cities';
import { getCurrentWeather } from '@/services/weatherService';

export type CheckInWeather = { code: number; temperature: number; city: string };

export type WeatherState =
  | { status: 'loading' }
  | { status: 'unavailable' } // no internet etc. The check-in is still saved, just without weather.
  | { status: 'ready'; weather: CheckInWeather };

/**
 * Fetches the current weather for the check-in (Open-Meteo, through the weather service).
 * It starts once when `enabled` becomes true. A failure never blocks saving: the check-in
 * simply has no weather.
 */
export function useCheckInWeather(enabled: boolean): WeatherState {
  const [state, setState] = useState<WeatherState>({ status: 'loading' });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    getCurrentWeather(DEFAULT_CITY.lat, DEFAULT_CITY.lon)
      .then((w) => {
        if (cancelled) return;
        setState({
          status: 'ready',
          weather: { code: w.weatherCode, temperature: Math.round(w.temperature), city: DEFAULT_CITY.name },
        });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'unavailable' });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
