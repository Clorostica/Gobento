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
    return response.events || [];
  }

  async getEventById(eventId: string): Promise<Event> {
    return this.apiClient.get<Event>(`/events/${eventId}`);
  }

  async createEvent(eventData: Partial<Event>): Promise<Event> {
    return this.apiClient.post<Event>("/events", eventData);
  }

  async updateEvent(eventId: string, eventData: Partial<Event>): Promise<Event> {
    return this.apiClient.put<Event>(`/events/${eventId}`, eventData);
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.apiClient.delete(`/events/${eventId}`);
  }

  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    return this.apiClient.get<UserProfileResponse>(`/events/user/${userId}`);
  }
}

