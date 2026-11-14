// Cities the user can pick for the forecast. We send only these fixed
// coordinates to Open-Meteo, never the phone's GPS position (brief 5.1).
// City names are proper nouns, so they are not translated.
export type City = { id: string; name: string; lat: number; lon: number };

export const CITIES: City[] = [
  { id: 'zagreb', name: 'Zagreb', lat: 45.81, lon: 15.98 },
  { id: 'dubrovnik', name: 'Dubrovnik', lat: 42.65, lon: 18.09 },
  { id: 'split', name: 'Split', lat: 43.51, lon: 16.44 },
  { id: 'rijeka', name: 'Rijeka', lat: 45.33, lon: 14.44 },
  { id: 'osijek', name: 'Osijek', lat: 45.55, lon: 18.69 },
];

export const DEFAULT_CITY = CITIES[0];
