/**
 * Event utility functions
 */

import type { Event } from "@/types/tasks/task.types";
import type { EventFilter } from "@/config/constants";
import { COLOR_CLASSES } from "@/config/constants";

/**
 * Gets a random color class for events
 */
export const getRandomColorClass = (): string => {
  const index = Math.floor(Math.random() * COLOR_CLASSES.length);
  return COLOR_CLASSES[index] || COLOR_CLASSES[0];
};

/**
 * Filters events by search term
 */
export const filterEventsBySearch = (
  events: Event[],
  searchTerm: string
): Event[] => {
  if (!searchTerm.trim()) return events;

  const lowerSearch = searchTerm.toLowerCase();
  return events.filter((event) => {
    const title = (event.title || "").toLowerCase();
    const text = (event.text || "").toLowerCase();
    return title.includes(lowerSearch) || text.includes(lowerSearch);
  });
};

/**
 * Filters events by status
 */
export const filterEventsByStatus = (
  events: Event[],
  statusFilter: EventFilter
): Event[] => {
  if (statusFilter === "all") return events;
  if (statusFilter === "liked") {
    return events.filter((event) => event.liked === true);
  }
  return events.filter((event) => event.status === statusFilter);
};

/**
 * Normalizes event data for storage
 */
export const normalizeEventForStorage = (event: Event): Event => {
  return {
    id: event.id,
    status: event.status,
    colorClass: event.colorClass,
    title: event.title?.trim() || null,
    text: event.text?.trim() || null,
    dueDate: event.dueDate?.trim() || null,
    startTime: event.startTime?.trim() || null,
    address: event.address?.trim() || null,
    images: Array.isArray(event.images) ? event.images : [],
    liked: Boolean(event.liked),
  };
};

