export type Event = {
  id: string;
  title?: string | null; // Event title (main heading)
  text?: string | null; // Event description/content
  status: string;
  colorClass: string | undefined;
  dueDate?: string | null; // ISO date string
  startTime?: string | null; // Time string (HH:mm format)
  images?: string[]; // Array of base64 image strings or image URLs
  liked?: boolean; // Whether the event is liked
  address?: string | null; // Event address/location
  position?: number | null; // Event position/order in the list
  image_url?: string | null; // Single image URL from uploadthing
  sharedFromUserId?: string | null; // ID of user who shared this event (if copied from another user)
};

// Keep Task as alias for backward compatibility during migration
export type Task = Event;

export type Todo = {
  id: number;
  title: string;
  completed: boolean;
};
