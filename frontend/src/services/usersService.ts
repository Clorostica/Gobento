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

  async createUser(): Promise<UserResponse> {
    return this.apiClient.post<UserResponse>("/users");
  }

  async checkUserExists(): Promise<boolean> {
    try {
      const user = await this.apiClient.get<UserResponse>("/users");
      return !!(user.id && user.email);
    } catch {
      return false;
    }
  }
}

