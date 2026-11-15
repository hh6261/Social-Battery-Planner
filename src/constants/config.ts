/**
 * App-wide configuration. Fill these in when the pages exist.
 * While a URL is null, the app shows a "coming soon" dialog instead of opening it.
 */
export const APP_NAME = 'Social Battery';

export const LINKS = {
  terms: null as string | null,
  helpFaq: null as string | null,
};

/**
 * Tab labels live in the locale files under tabs.* (home, tracker, insights, profile).
 * The flow map calls tab 2 "Journal"; the wireframes say "Tracker". Change tabs.tracker to rename it.
 */
export const TAB_LABEL_KEYS = {
  home: 'tabs.home',
  tracker: 'tabs.tracker',
  insights: 'tabs.insights',
  profile: 'tabs.profile',
} as const;

export const PASSWORD_MIN_LENGTH = 8;
