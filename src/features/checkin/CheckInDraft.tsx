import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import type { CheckIn, GroupSize } from '@/db/types';

export type CheckInDraft = {
  batteryLevel: number | null;
  moods: string[];
  activity: string;
  groupSize: GroupSize | null;
  oneOnOne: boolean | null;
  strangerCount: number | null;
  friendsMade: number | null;
  energyChange: number | null; // -100 (drained me) to 100 (recharged me)
  noteTitle: string;
  notes: string;
  /** Read-only: the weather saved with a check-in that is being edited. */
  weatherCode: number | null;
  weatherTemp: number | null;
  weatherCity: string | null;
};

const EMPTY: CheckInDraft = {
  batteryLevel: null,
  moods: [],
  activity: '',
  groupSize: null,
  oneOnOne: null,
  strangerCount: null,
  friendsMade: null,
  energyChange: null,
  noteTitle: '',
  notes: '',
  weatherCode: null,
  weatherTemp: null,
  weatherCity: null,
};

type DraftContextValue = {
  draft: CheckInDraft;
  /** Id of the saved check-in being edited, or null when this is a brand new check-in. */
  editingId: number | null;
  update: (patch: Partial<CheckInDraft>) => void;
  /** Throw away all answers and leave edit mode. Call before starting a new check-in. */
  reset: () => void;
  /** Load a saved check-in into the draft so the confirmation screen can edit it. */
  startEdit: (checkIn: CheckIn) => void;
};

const DraftContext = createContext<DraftContextValue | null>(null);

/**
 * Lives in src/app/checkin/_layout.tsx: created when a check-in starts, thrown away when the
 * whole flow is closed. Moving between steps keeps it, so Back never loses answers.
 */
export function CheckInDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<CheckInDraft>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);

  const update = useCallback((patch: Partial<CheckInDraft>) => setDraft((d) => ({ ...d, ...patch })), []);
  const reset = useCallback(() => {
    setDraft(EMPTY);
    setEditingId(null);
  }, []);
  const startEdit = useCallback((c: CheckIn) => {
    setDraft({
      batteryLevel: c.batteryLevel,
      moods: c.moods,
      activity: c.activity ?? '',
      groupSize: c.groupSize,
      oneOnOne: c.oneOnOne,
      strangerCount: c.strangerCount,
      friendsMade: c.friendsMade,
      energyChange: c.energyChange,
      noteTitle: c.noteTitle ?? '',
      notes: c.notes ?? '',
      weatherCode: c.weatherCode,
      weatherTemp: c.weatherTemp,
      weatherCity: c.weatherCity,
    });
    setEditingId(c.id);
  }, []);
  const value = useMemo(
    () => ({ draft, editingId, update, reset, startEdit }),
    [draft, editingId, update, reset, startEdit]
  );

  return (
    <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
  );
}

export function useCheckInDraft(): DraftContextValue {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useCheckInDraft must be used inside CheckInDraftProvider');
  return ctx;
}
