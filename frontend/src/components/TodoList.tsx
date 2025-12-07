import React, { useCallback, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Lock, UserPlus, Eye, EyeOff, Sparkles } from "lucide-react";
import type { Event } from "@/types/tasks/task.types";
import MagicBento from "./MagicBento";
import { getEvents, saveEvents } from "../utils/storage";
import { convertFileToBase64, compressImage } from "../utils/imageHandler";

const API_URL = import.meta.env.VITE_API as string;

const COLOR_CLASSES = [
  "bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200 hover:border-gray-300 shadow-sm",
  "bg-gradient-to-br from-blue-50/80 to-blue-100/40 border-blue-200/60 hover:border-blue-300 shadow-sm",
  "bg-gradient-to-br from-purple-50/80 to-purple-100/40 border-purple-200/60 hover:border-purple-300 shadow-sm",
  "bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 border-emerald-200/60 hover:border-emerald-300 shadow-sm",
  "bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200 hover:border-slate-300 shadow-sm",
  "bg-gradient-to-br from-indigo-50/80 to-indigo-100/40 border-indigo-200/60 hover:border-indigo-300 shadow-sm",
  "bg-gradient-to-br from-cyan-50/80 to-cyan-100/40 border-cyan-200/60 hover:border-cyan-300 shadow-sm",
  "bg-gradient-to-br from-violet-50/80 to-violet-100/40 border-violet-200/60 hover:border-violet-300 shadow-sm",
] as const;

interface TodoListProps {
  todos: Event[];
  setTodos: React.Dispatch<React.SetStateAction<Event[]>>;
  search: string;
  filter: "all" | "planned" | "upcoming" | "happened" | "liked";
  token: string | null;
  isAuthenticated: boolean;
  onFollowClick?: () => void;
  profileOwnerName?: string;
}

type EventStatus = "planned" | "upcoming" | "happened";

const getRandomColorClass = (): string => {
  const index = Math.floor(Math.random() * COLOR_CLASSES.length);
  return COLOR_CLASSES[index] || COLOR_CLASSES[0];
};

const filterEventsBySearch = (events: Event[], searchTerm: string): Event[] => {
  if (!searchTerm) return events;
  const lowerSearch = searchTerm.toLowerCase();
  return events.filter((event) => {
    const title = (event.title || "").toLowerCase();
    const text = (event.text || "").toLowerCase();
    return title.includes(lowerSearch) || text.includes(lowerSearch);
  });
};

const filterEventsByStatus = (
  events: Event[],
  statusFilter: "all" | "planned" | "upcoming" | "happened" | "liked"
): Event[] => {
  if (statusFilter === "all") return events;
  if (statusFilter === "liked") {
    return events.filter((event) => event.liked === true);
  }
  return events.filter((event) => event.status === statusFilter);
};

// Helper function to normalize event data for storage
const normalizeEventForStorage = (event: Event): Event => {
  return {
    id: event.id,
    status: event.status,
    colorClass: event.colorClass,
    title: event.title && event.title.trim() ? event.title.trim() : null,
    text: event.text && event.text.trim() ? event.text.trim() : null,
    dueDate:
      event.dueDate && event.dueDate.trim() ? event.dueDate.trim() : null,
    startTime:
      event.startTime && event.startTime.trim() ? event.startTime.trim() : null,
    address:
      event.address && event.address.trim() ? event.address.trim() : null,
    images: Array.isArray(event.images) ? event.images : [],
    liked: Boolean(event.liked),
  };
};

const useEventOperations = (
  todos: Event[],
  setTodos: React.Dispatch<React.SetStateAction<Event[]>>,
  token: string | null,
  isAuthenticated: boolean
) => {
  const handleError = useCallback((operation: string, error: unknown) => {
    console.error(`Error ${operation} event:`, error);
    alert(`Oops! Something went wrong ${operation} your event 😕`);
  }, []);

  const addEvent = useCallback(
    async (status: EventStatus = "planned", images?: string[]) => {
      const newEvent: Event = {
        id: uuidv4(),
        status,
        text: "",
        title: null,
        address: null,
        dueDate: null,
        startTime: null,
        colorClass: getRandomColorClass(),
        images: images || [],
        liked: false,
      };

      setTodos((prev) => [...prev, newEvent]);

      if (!isAuthenticated) {
        const existingEvents = getEvents();
        const eventForStorage = normalizeEventForStorage(newEvent);
        saveEvents([...existingEvents, eventForStorage]);
        return;
      }

      try {
        if (!token) {
          throw new Error("No authentication token available");
        }

        const eventData = {
          id: newEvent.id,
          status: newEvent.status,
          text: newEvent.text || null,
          title: newEvent.title || null,
          colorClass: newEvent.colorClass || null,
          address: newEvent.address || null,
          dueDate: newEvent.dueDate || null,
          startTime: newEvent.startTime || null,
        };

        const response = await fetch(`${API_URL}/events`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        setTodos((prev) => prev.filter((event) => event.id !== newEvent.id));
        handleError("creating", error);
      }
    },
    [isAuthenticated, token, setTodos, handleError]
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      const previousTodos = todos;
      setTodos((prev) => prev.filter((event) => event.id !== eventId));

      if (!isAuthenticated) {
        const events = getEvents();
        const updatedEvents = events.filter((event) => event.id !== eventId);
        saveEvents(updatedEvents);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        setTodos(previousTodos);
        handleError("deleting", error);
      }
    },
    [todos, isAuthenticated, token, setTodos, handleError]
  );

  const editEvent = useCallback(
    async (
      id: string,
      title: string,
      text: string,
      dueDate?: string | null,
      startTime?: string | null,
      images?: string[],
      address?: string | null
    ) => {
      const event = todos.find((e) => e.id === id);
      if (!event) return;

      // Build updatedEvent ensuring all fields are properly set
      const updatedEvent: Event = {
        ...event,
        title: title !== undefined ? title.trim() || null : event.title ?? null,
        text: text !== undefined ? text.trim() || null : event.text ?? null,
        dueDate:
          dueDate !== undefined
            ? dueDate?.trim() || null
            : event.dueDate ?? null,
        startTime:
          startTime !== undefined
            ? startTime?.trim() || null
            : event.startTime ?? null,
        address:
          address !== undefined
            ? address?.trim() || null
            : event.address ?? null,
        images: images !== undefined ? images : event.images || [],
        liked: event.liked || false,
      };

      const previousTodos = todos;
      setTodos((prev) => prev.map((e) => (e.id === id ? updatedEvent : e)));

      if (!isAuthenticated) {
        // Normalize and save to localStorage
        const eventForStorage = normalizeEventForStorage(updatedEvent);
        const localEvents = getEvents();
        const updatedEvents = localEvents.map((e) =>
          e.id === id ? eventForStorage : e
        );
        saveEvents(updatedEvents);

        console.log("✅ Event saved to localStorage:", {
          id: eventForStorage.id,
          title: eventForStorage.title,
          text: eventForStorage.text,
          dueDate: eventForStorage.dueDate,
          startTime: eventForStorage.startTime,
          address: eventForStorage.address,
        });

        return;
      }

      try {
        const response = await fetch(`${API_URL}/events/${id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: updatedEvent.title,
            text: updatedEvent.text,
            status: event.status,
            dueDate: updatedEvent.dueDate,
            startTime: updatedEvent.startTime,
            images: updatedEvent.images,
            address: updatedEvent.address,
            liked: updatedEvent.liked,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        setTodos(previousTodos);
        handleError("editing", error);
      }
    },
    [todos, isAuthenticated, token, setTodos, handleError]
  );

  const changeEventStatus = useCallback(
    async (
      eventId: string,
      newStatus: EventStatus,
      position: number | null = null
    ) => {
      const event = todos.find((e) => e.id === eventId);
      if (!event) return;

      const updatedEvent = { ...event, status: newStatus };
      const previousTodos = todos;

      setTodos((prev) =>
        prev.map((e) => (e.id === eventId ? updatedEvent : e))
      );

      if (!isAuthenticated) {
        const eventForStorage = normalizeEventForStorage(updatedEvent);
        const localEvents = getEvents();
        const updatedEvents = localEvents.map((e) =>
          e.id === eventId ? eventForStorage : e
        );
        saveEvents(updatedEvents);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: event.text,
            status: newStatus,
            dueDate: event.dueDate,
            startTime: event.startTime,
            address: event.address,
            title: event.title,
            images: event.images,
            liked: event.liked,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        setTodos(previousTodos);
        handleError("updating", error);
      }
    },
    [todos, isAuthenticated, token, setTodos, handleError]
  );

  const reorderEvents = useCallback(
    (draggedEventId: string, targetEventId: string) => {
      const draggedEvent = todos.find((e) => e.id === draggedEventId);
      const targetEvent = todos.find((e) => e.id === targetEventId);

      if (!draggedEvent || !targetEvent || draggedEventId === targetEventId)
        return;

      const previousTodos = todos;
      const draggedIndex = todos.findIndex((e) => e.id === draggedEventId);
      const targetIndex = todos.findIndex((e) => e.id === targetEventId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const newEvents = [...todos];
      newEvents.splice(draggedIndex, 1);
      newEvents.splice(targetIndex, 0, draggedEvent);

      setTodos(newEvents);

      if (!isAuthenticated) {
        const normalizedEvents = newEvents.map(normalizeEventForStorage);
        saveEvents(normalizedEvents);
      }
    },
    [todos, isAuthenticated, setTodos]
  );

  const toggleLike = useCallback(
    async (eventId: string, liked: boolean) => {
      const event = todos.find((e) => e.id === eventId);
      if (!event) return;

      const updatedEvent: Event = {
        ...event,
        liked,
      };

      const previousTodos = todos;

      setTodos((prev) =>
        prev.map((e) => (e.id === eventId ? updatedEvent : e))
      );

      if (!isAuthenticated) {
        const eventForStorage = normalizeEventForStorage(updatedEvent);
        const localEvents = getEvents();
        const updatedEvents = localEvents.map((e) =>
          e.id === eventId ? eventForStorage : e
        );
        saveEvents(updatedEvents);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: event.title,
            text: event.text,
            status: event.status,
            dueDate: event.dueDate,
            startTime: event.startTime,
            address: event.address,
            images: event.images,
            liked: liked,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        setTodos(previousTodos);
        handleError("toggling like", error);
      }
    },
    [todos, isAuthenticated, token, setTodos, handleError]
  );

  return {
    addEvent,
    deleteEvent,
    editEvent,
    changeEventStatus,
    reorderEvents,
    toggleLike,
  };
};

export default function TodoList({
  todos,
  setTodos,
  search,
  filter,
  token,
  isAuthenticated,
  onFollowClick,
  profileOwnerName,
}: TodoListProps) {
  const {
    addEvent,
    deleteEvent,
    editEvent,
    changeEventStatus,
    reorderEvents,
    toggleLike,
  } = useEventOperations(todos, setTodos, token, isAuthenticated);

  const [isDragOver, setIsDragOver] = useState(false);

  const filteredTodos = useMemo(() => {
    const statusFiltered = filterEventsByStatus(todos, filter);
    return filterEventsBySearch(statusFiltered, search);
  }, [todos, filter, search]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (files.length === 0) return;

      try {
        const imagePromises = files.map(async (file) => {
          const compressedFile = await compressImage(file);
          return await convertFileToBase64(compressedFile);
        });

        const images = await Promise.all(imagePromises);
        await addEvent("planned", images);
      } catch (error) {
        console.error("Error creating event from dropped images:", error);
        alert("Error creating event from images. Please try again.");
      }
    },
    [addEvent]
  );

  return (
    <div
      className="w-full relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-purple-500/20 backdrop-blur-sm border-4 border-dashed border-purple-400 rounded-lg flex items-center justify-center pointer-events-none">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">📷</div>
            <div className="text-2xl font-bold">
              Drop images here to create a new event
            </div>
          </div>
        </div>
      )}

      <div>
        <MagicBento
          textAutoHide
          enableStars
          enableSpotlight
          enableBorderGlow
          enableTilt
          enableMagnetism
          clickEffect
          spotlightRadius={300}
          particleCount={12}
          glowColor="132, 0, 255"
          tasks={filteredTodos}
          onEdit={(id, title, text, dueDate, startTime, images, address) =>
            editEvent(id, title, text, dueDate, startTime, images, address)
          }
          onDelete={deleteEvent}
          onStatusChange={(id, newStatus) =>
            changeEventStatus(id, newStatus as EventStatus)
          }
          onReorder={reorderEvents}
          onLikeToggle={toggleLike}
          addTask={(status) => addEvent(status as EventStatus)}
          currentFilter={filter}
        />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
          }
          75% {
            transform: translateY(-15px) translateX(5px);
          }
        }
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
