/**
 * Friends service for API operations
 */

import { ApiClient } from "@/utils/apiClient";

export interface User {
  id: string;
  email: string;
  username?: string | null;
  name?: string | null;
}

export interface FollowersFollowingResponse {
  following: User[];
  followers: User[];
}

export class FriendsService {
  constructor(private apiClient: ApiClient) {}

  async getFollowersAndFollowing(): Promise<FollowersFollowingResponse> {
    return this.apiClient.get<FollowersFollowingResponse>(
      "/friends/followers-following"
    );
  }

  async getFollowersAndFollowingByUserId(
    userId: string
  ): Promise<FollowersFollowingResponse> {
    return this.apiClient.get<FollowersFollowingResponse>(
      `/friends/followers-following/${userId}`
    );
  }
}

