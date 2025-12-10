/**
 * Events service for API operations
 */

import type { Event } from "@/types/tasks/task.types";
import type { EventsResponse, UserProfileResponse } from "@/types/api";
import { ApiClient } from "@/utils/apiClient";

export class EventsService {
  constructor(private apiClient: ApiClient) {}

  async getAllEvents(): Promise<Event[]> {
    const response = await this.apiClient.get<EventsResponse>("/events");
    const events = response.events || [];
    const processedEvents = events.map((event: any) => {
      const imageUrl = event.imageUrl || event.image_url;
      const processedEvent = {
        ...event,
        ...(imageUrl && !event.images?.includes(imageUrl)
          ? {
              images: [imageUrl, ...(event.images || [])],
              image_url: imageUrl,
            }
          : {}),
      };

      // Debug: log events with sharedFromUserId
      if (
        processedEvent.sharedFromUserId ||
        (processedEvent as any).shared_from_user_id
      ) {
        console.log("📥 Event loaded with sharedFromUserId:", {
          id: processedEvent.id,
          title: processedEvent.title,
          sharedFromUserId: processedEvent.sharedFromUserId,
          shared_from_user_id: (processedEvent as any).shared_from_user_id,
        });
      }

      return processedEvent;
    });

    const sharedCount = processedEvents.filter(
      (e: any) => e.sharedFromUserId || (e as any).shared_from_user_id
    ).length;
    console.log(
      `📊 Loaded ${processedEvents.length} events, ${sharedCount} are shared from friends`
    );

    return processedEvents;
  }

  async getEventById(eventId: string): Promise<Event> {
    return this.apiClient.get<Event>(`/events/${eventId}`);
  }

  async createEvent(eventData: Partial<Event>): Promise<Event> {
    return this.apiClient.post<Event>("/events", eventData);
  }

  async updateEvent(
    eventId: string,
    eventData: Partial<Event>
  ): Promise<Event> {
    return this.apiClient.put<Event>(`/events/${eventId}`, eventData);
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.apiClient.delete(`/events/${eventId}`);
  }

  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    return this.apiClient.get<UserProfileResponse>(`/events/user/${userId}`);
  }
}
