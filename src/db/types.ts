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
