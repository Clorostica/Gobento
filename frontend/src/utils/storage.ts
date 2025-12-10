import type { Event } from "@/types/tasks/task.types";
const NO_USER_EVENTS_KEY = "events:nouser";

export const getEvents = (): Event[] => {
  try {
    const events = localStorage.getItem(NO_USER_EVENTS_KEY);
    const parsed = events ? JSON.parse(events) : [];

    // Log what we're loading for debugging
    if (parsed.length > 0) {
      console.log(
        "getEvents - Loading events from localStorage:",
        parsed.map((e: Event) => ({
          id: e.id,
          address: e.address,
          dueDate: e.dueDate,
          startTime: e.startTime,
          title: e.title,
          text: e.text,
        }))
      );
    }

    return parsed;
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return [];
  }
};

export const saveEvents = (events: Event[]): void => {
  try {
    // Log what we're saving for debugging
    const eventsToSave = events.map((event) => ({
      id: event.id,
      address: event.address,
      dueDate: event.dueDate,
      startTime: event.startTime,
      title: event.title,
      text: event.text,
    }));
    console.log("saveEvents - Saving events to localStorage:", eventsToSave);

    localStorage.setItem(NO_USER_EVENTS_KEY, JSON.stringify(events));

    // Verify it was saved
    const saved = localStorage.getItem(NO_USER_EVENTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log(
        "saveEvents - Verified saved data:",
        parsed.map((e: Event) => ({
          id: e.id,
          address: e.address,
          dueDate: e.dueDate,
          startTime: e.startTime,
        }))
      );
    }
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
};
