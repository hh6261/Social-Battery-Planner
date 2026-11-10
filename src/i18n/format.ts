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