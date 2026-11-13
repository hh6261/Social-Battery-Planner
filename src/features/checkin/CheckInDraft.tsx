import { createContext, ReactNode, useContext, useState } from 'react';

export type CheckInDraft = {
  batteryLevel: number | null;
  moods: string[];
  activity: string;
  attendees: string;
  impactRating: number | null;
  notes: string;
};

const EMPTY: CheckInDraft = {
  batteryLevel: null,
  moods: [],
  activity: '',
  attendees: '',
  impactRating: null,
  notes: '',
};

type DraftContextValue = {
  draft: CheckInDraft;
  update: (patch: Partial<CheckInDraft>) => void;
  reset: () => void;
};

const DraftContext = createContext<DraftContextValue | null>(null);

export function CheckInDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<CheckInDraft>(EMPTY);
  const update = (patch: Partial<CheckInDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const reset = () => setDraft(EMPTY);
  return <DraftContext.Provider value={{ draft, update, reset }}>{children}</DraftContext.Provider>;
}

export function useCheckInDraft(): DraftContextValue {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useCheckInDraft must be used inside CheckInDraftProvider');
  return ctx;
}