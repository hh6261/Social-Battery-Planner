import type { EnergyLevel, Situation, SituationKind, UserSettings } from '../services/types';

export interface SituationGroup {
  level: EnergyLevel;
  title: string;
  hint: string;
  options: string[];
}

/** Step 1 of personalization: "What tends to drain you?" */
export const DRAIN_GROUPS: SituationGroup[] = [
  {
    level: 'low',
    title: 'Low',
    hint: 'Uses a little energy',
    options: ['Short phone calls', 'Small talk', 'Quick errands'],
  },
  {
    level: 'moderate',
    title: 'Moderate',
    hint: 'Needs some recovery',
    options: ['Group lunches', 'Busy workplaces', 'Meeting new people'],
  },
  {
    level: 'strong',
    title: 'Strong',
    hint: 'Uses a lot of energy',
    options: ['Large gatherings', 'Long social days', 'Conflict'],
  },
];

/** Step 2 of personalization: "What helps you recharge?" */
export const RECHARGE_GROUPS: SituationGroup[] = [
  {
    level: 'low',
    title: 'Light',
    hint: 'A small reset',
    options: ['Fresh air', 'A warm drink', 'A short break'],
  },
  {
    level: 'moderate',
    title: 'Moderate',
    hint: 'Helps me settle',
    options: ['Reading quietly', 'Time alone', 'A gentle walk'],
  },
  {
    level: 'strong',
    title: 'Strong',
    hint: 'Feels deeply restoring',
    options: ['A quiet evening', 'A full day at home', 'Restful sleep'],
  },
];

export const LEVEL_LABELS: Record<SituationKind, Record<EnergyLevel, string>> = {
  drain: { low: 'Low', moderate: 'Moderate', strong: 'Strong' },
  recharge: { low: 'Light', moderate: 'Moderate', strong: 'Strong' },
};

let idCounter = 0;
export function makeSituation(
  label: string,
  level: EnergyLevel,
  kind: SituationKind,
  custom: boolean,
): Situation {
  idCounter += 1;
  return {
    id: `${kind}-${Date.now().toString(36)}-${idCounter}`,
    label: label.trim(),
    level,
    kind,
    custom,
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  reminders: {
    enabled: true,
    frequency: 'every_day',
    time: '18:00',
    includeDrainEstimate: true,
    planReminders: true,
  },
  quietHours: { from: '21:00', to: '08:00', frequency: 'every_day' },
  display: { theme: 'device', fontSize: 'regular' },
  connections: { messages: false, calendar: true, photos: false },
};

export const FREQUENCY_OPTIONS = [
  { value: 'every_day', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'weekly', label: 'Once a week' },
] as const;

export const THEME_OPTIONS = [
  { value: 'device', label: 'Device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

export const FONT_SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'regular', label: 'Regular' },
  { value: 'large', label: 'Large' },
] as const;
