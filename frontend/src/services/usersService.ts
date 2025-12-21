/**
 * Users service for API operations
 */

import type { UserResponse } from "@/types/api";
import { ApiClient } from "@/utils/apiClient";

export class UsersService {
  constructor(private apiClient: ApiClient) {}

  async getCurrentUser(): Promise<UserResponse> {
    return this.apiClient.get<UserResponse>("/users");
  }

  async createUser(data?: {
    email?: string;
    avatarUrl?: string;
    username?: string;
  }): Promise<UserResponse> {
    return this.apiClient.post<UserResponse>("/users", data || {});
  }

  async updateUsername(
    username: string,
    avatarUrl?: string | null
  ): Promise<UserResponse> {
    return this.apiClient.put<UserResponse>("/users", {
      username,
      avatarUrl,
    });
  }

  async checkUserExists(): Promise<boolean> {
    try {
      const user = await this.apiClient.get<UserResponse>("/users");
      return !!(user.id && user.email);
    } catch {
      return false;
    }
  }

  async deleteUser(): Promise<void> {
    return this.apiClient.delete<void>("/users");
  }
}
