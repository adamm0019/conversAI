import { useState, useCallback } from 'react';
import { RealtimeEvent } from '../types';

export const useEventLogging = () => {
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);

  const addEvent = useCallback((event: RealtimeEvent) => {
    setRealtimeEvents((prevEvents) => {
      const lastEvent = prevEvents[prevEvents.length - 1];
      if (lastEvent?.event.type === event.event.type) {
        lastEvent.count = (lastEvent.count || 0) + 1;
        return prevEvents.slice(0, -1).concat(lastEvent);
      } else {
        return prevEvents.concat(event);
      }
    });
  }, []);

  const clearEvents = useCallback(() => {
    setRealtimeEvents([]);
  }, []);

  return {
    realtimeEvents,
    addEvent,
    clearEvents,
  };
};