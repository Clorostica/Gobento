/**
 * API-related type definitions
 */

import type { Event } from "../tasks/task.types";

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface UserResponse {
  id?: string;
  email?: string;
  name?: string;
  isPrivate?: boolean;
}

export interface EventsResponse {
  events: Event[];
}

export interface UserProfileResponse {
  user: UserResponse;
  events: Event[];
}
