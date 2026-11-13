export type CheckIn = {
  id: number;
  batteryLevel: number; // 0-100
  activity: string | null;
  attendees: string | null;
  impactRating: number | null; // 1-5 (1 = drained me, 5 = recharged me)
  notes: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  eventId: number | null;
  moods: string[]; // mood keys, e.g. "calm"
};

export type NewCheckIn = {
  batteryLevel: number;
  activity?: string | null;
  attendees?: string | null;
  impactRating?: number | null;
  notes?: string | null;
  createdAtUtc?: string; // defaults to now (UTC)
  eventId?: number | null;
  moods?: string[];
};

export type CheckInPatch = Partial<NewCheckIn>;

export type UserProfile = {
  id: 1;
  displayName: string | null;
  locale: string; // e.g. "en", "hr", "ja"
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type JournalEntry = {
  id: number;
  title: string | null;
  body: string;
  checkInId: number | null;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type NewJournalEntry = {
  title?: string | null;
  body: string;
  checkInId?: number | null;
  createdAtUtc?: string; // defaults to now (UTC)
};

export type JournalPatch = Partial<NewJournalEntry>;

export type EventType = {
  id: number;
  key: string; // stable id for translations: t(`eventType.${key}`)
  name: string; // English name stored in the database (fallback only)
  emoji: string | null;
  defaultDrain: number; // 0-100
};

export type PlannedEvent = {
  id: number;
  eventTypeId: number;
  typeKey: string;
  title: string;
  location: string | null;
  startsAtUtc: string;
  endsAtUtc: string | null;
  expectedDrain: number | null; // 0-100, how much of the social battery it is likely to use
  isOutdoor: boolean;
};

export type NewEvent = {
  eventTypeId: number;
  title: string;
  location?: string | null;
  startsAtUtc: string;
  endsAtUtc?: string | null;
  expectedDrain?: number | null; // defaults to the type's default_drain
  isOutdoor?: boolean;
};

export type EventPatch = Partial<NewEvent>;

export type RechargeActivity = {
  id: number;
  key: string | null; // built-in idea, translated: t(`recharge.defaults.${key}`)
  name: string | null; // the user's own activity
  minutes: 15 | 30 | 60;
  isOutdoor: boolean;
};

export type NewRechargeActivity = {
  name: string;
  minutes: 15 | 30 | 60;
  isOutdoor?: boolean;
};
