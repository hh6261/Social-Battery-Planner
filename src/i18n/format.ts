import i18n from './index';

const locale = () => i18n.language;

export const formatDate = (d: Date | number) =>
  new Intl.DateTimeFormat(locale(), { dateStyle: 'medium' }).format(d);

export const formatTime = (d: Date | number) =>
  new Intl.DateTimeFormat(locale(), { timeStyle: 'short' }).format(d);

export const formatNumber = (n: number) =>
  new Intl.NumberFormat(locale()).format(n);

export const formatPercent = (n: number) =>
  new Intl.NumberFormat(locale(), { style: 'percent' }).format(n);

export const formatList = (items: string[]) =>
  new Intl.ListFormat(locale(), { style: 'long', type: 'conjunction' }).format(items);

export const sortStrings = (items: string[]) =>
  [...items].sort(new Intl.Collator(locale()).compare);

/** "Thursday, 22 October" heading. Croatian writes weekdays in lower case, so the first letter is raised. */
export const formatDayHeading = (d: Date | number) => {
  const text = new Intl.DateTimeFormat(locale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
  return text.charAt(0).toLocaleUpperCase(locale()) + text.slice(1);
};

/** Short weekday and day for chips: "Thu 22". */
export const formatShortDay = (d: Date | number) =>
  new Intl.DateTimeFormat(locale(), { weekday: 'short', day: 'numeric' }).format(d);
