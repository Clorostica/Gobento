// Utility functions for push notifications
import type { Event } from "@/types/tasks/task.types";

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const showNotification = (
  title: string,
  options?: NotificationOptions
): Notification | null => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return null;
  }

  try {
    return new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });
  } catch (error) {
    console.error("Error showing notification:", error);
    return null;
  }
};

export const checkOverdueEvents = (events: Event[]): void => {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset to start of day for comparison

  const overdueEvents = events.filter((event) => {
    if (!event.dueDate || event.status === "happened") return false;

    const dueDate = new Date(event.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate < now;
  });

  if (overdueEvents.length > 0) {
    const firstEvent = overdueEvents[0];
    const eventText =
      overdueEvents.length === 1 && firstEvent
        ? firstEvent.title || firstEvent.text || "Untitled event"
        : `${overdueEvents.length} events`;

    showNotification(`Overdue events: ${eventText}`, {
      body:
        overdueEvents.length === 1 && firstEvent
          ? `The event "${
              firstEvent.title || firstEvent.text || "Untitled event"
            }" is overdue`
          : `You have ${overdueEvents.length} overdue events`,
      tag: "overdue-events",
      requireInteraction: false,
    });
  }
};

// Keep for backward compatibility
export const checkOverdueTasks = checkOverdueEvents;
