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
 * Tab labels. The flow map calls tab 2 "Journal"; the wireframes say "Tracker".
 * Change it here and it updates everywhere.
 */
export const TAB_LABELS = {
  home: 'Home',
  tracker: 'Tracker',
  insights: 'Insights',
  profile: 'Profile',
};

export const PASSWORD_MIN_LENGTH = 8;
