import { useLocalSearchParams } from 'expo-router';

import EventFormScreen from '@/features/planner/EventFormScreen';

// /planner/event        -> new event
// /planner/event?id=12  -> edit (and delete) event 12
export default function EventFormRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const eventId = id !== undefined && Number.isInteger(Number(id)) ? Number(id) : null;
  return <EventFormScreen eventId={eventId} />;
}
