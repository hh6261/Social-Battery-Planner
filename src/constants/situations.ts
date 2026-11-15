import i18n from '../i18n';
import type {
  EnergyLevel,
  FontSizePreference,
  ReminderFrequency,
  Situation,
  SituationKind,
  ThemePreference,
  UserSettings,
} from '../services/types';

export interface SituationGroup {
  level: EnergyLevel;
  title: string;
  hint: string;
  options: string[];
}

const LEVELS: EnergyLevel[] = ['low', 'moderate', 'strong'];

// Preset options. The text lives in the locale files (situations.<kind>.options.<key>).
// When the user picks one it is saved as the translated text, like a custom entry.
const OPTION_KEYS: Record<SituationKind, Record<EnergyLevel, string[]>> = {
  drain: {
    low: ['shortCalls', 'smallTalk', 'quickErrands'],
    moderate: ['groupLunches', 'busyWorkplaces', 'meetingNewPeople'],
    strong: ['largeGatherings', 'longSocialDays', 'conflict'],
  },
  recharge: {
    low: ['freshAir', 'warmDrink', 'shortBreak'],
    moderate: ['readingQuietly', 'timeAlone', 'gentleWalk'],
    strong: ['quietEvening', 'fullDayAtHome', 'restfulSleep'],
  },
};

/** Personalization step 1 ("What tends to drain you?") and step 2 ("What helps you recharge?"). */
export function getSituationGroups(kind: SituationKind): SituationGroup[] {
  return LEVELS.map((level) => ({
    level,
    title: i18n.t(`situations.level.${kind}.${level}`),
    hint: i18n.t(`situations.hint.${kind}.${level}`),
    options: OPTION_KEYS[kind][level].map((key) => i18n.t(`situations.${kind}.options.${key}`)),
  }));
}

/** "Low", "Moderate", "Strong" (or "Light" for recharge), translated. */
export function levelLabel(kind: SituationKind, level: EnergyLevel): string {
  return i18n.t(`situations.level.${kind}.${level}`);
}

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

const FREQUENCIES: ReminderFrequency[] = ['every_day', 'weekdays', 'weekends', 'weekly'];
const THEMES: ThemePreference[] = ['device', 'light', 'dark', 'colorblind'];
const FONT_SIZES: FontSizePreference[] = ['small', 'regular', 'large'];

export const frequencyOptions = () =>
  FREQUENCIES.map((value) => ({ value, label: i18n.t(`options.frequency.${value}`) }));

export const themeOptions = () => THEMES.map((value) => ({ value, label: i18n.t(`options.theme.${value}`) }));

export const fontSizeOptions = () =>
  FONT_SIZES.map((value) => ({ value, label: i18n.t(`options.fontSize.${value}`) }));
