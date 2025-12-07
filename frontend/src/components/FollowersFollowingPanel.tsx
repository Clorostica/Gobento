import React, { useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Users, UserPlus, Search, X } from "lucide-react";
import FollowersList from "./FollowersList";
import FollowingList from "./FollowingList";

interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  isFollowing?: boolean;
}

interface FollowersFollowingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  API_URL: string;
  userId?: string; // Optional: if provided, show followers/following of that user
}

export default function FollowersFollowingPanel({
  isOpen,
  onClose,
  token,
  API_URL,
  userId,
}: FollowersFollowingPanelProps) {
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    "followers"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const { isAuthenticated } = useAuth0();

  const checkIsFollowing = useCallback(
    async (profileOwnerId: string): Promise<boolean> => {
      if (!token) return false;

      try {
        const response = await fetch(
          `${API_URL}/friends/is-following/${profileOwnerId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          return data.isFollowing || false;
        }
      } catch (error) {
        console.error("Error checking following status:", error);
      }
      return false;
    },
    [token, API_URL]
  );

  const loadFollowersAndFollowing = useCallback(async () => {
    if (!token || !isAuthenticated) return;

    setIsLoading(true);
    try {
      // If userId is provided, fetch that user's followers/following, otherwise fetch current user's
      const url = userId
        ? `${API_URL}/friends/followers-following/${userId}`
        : `${API_URL}/friends/followers-following`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const followersList = data.followers || [];
        const followingList = data.following || [];

        // Check if following each user in the lists
        const followersWithStatus = await Promise.all(
          followersList.map(async (user: User) => {
            const isFollowing = await checkIsFollowing(user.id);
            return { ...user, isFollowing };
          })
        );

        const followingWithStatus = await Promise.all(
          followingList.map(async (user: User) => {
            const isFollowing = await checkIsFollowing(user.id);
            return { ...user, isFollowing };
          })
        );

        setFollowers(followersWithStatus);
        setFollowing(followingWithStatus);
      }
    } catch (error) {
      console.error("Error loading followers/following:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token, API_URL, isAuthenticated, checkIsFollowing, userId]);

  useEffect(() => {
    if (isOpen && token && isAuthenticated) {
      loadFollowersAndFollowing();
      setSearchTerm("");
    }
  }, [isOpen, token, isAuthenticated, loadFollowersAndFollowing]);

  if (!isOpen || !isAuthenticated) return null;

  const listToShow = activeTab === "followers" ? followers : following;

  const filteredList = listToShow.filter((u) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      u.email.toLowerCase().includes(searchLower) ||
      u.name?.toLowerCase().includes(searchLower)
    );
  });

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-start justify-center bg-black/40 z-50 pt-10"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden">
        {/* Header + Tabs + Search */}
        <div className="flex-shrink-0 p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Connections</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg mb-3">
            <button
              onClick={() => setActiveTab("followers")}
              className={`flex-1 py-2.5 px-4 rounded-md font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === "followers"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Users size={16} />
              <span>Followers</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === "followers"
                    ? "bg-purple-100 text-purple-600"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {followers.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={`flex-1 py-2.5 px-4 rounded-md font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === "following"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <UserPlus size={16} />
              <span>Following</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === "following"
                    ? "bg-purple-100 text-purple-600"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {following.length}
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-3"></div>
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                {searchTerm ? (
                  <Search className="text-gray-400" size={24} />
                ) : activeTab === "followers" ? (
                  <Users className="text-gray-400" size={24} />
                ) : (
                  <UserPlus className="text-gray-400" size={24} />
                )}
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                {searchTerm
                  ? "No results found"
                  : activeTab === "followers"
                  ? "No followers yet"
                  : "Not following anyone yet"}
              </p>
              <p className="text-xs text-gray-500">
                {searchTerm
                  ? "Try a different search term"
                  : activeTab === "followers"
                  ? "Share your content to gain followers"
                  : "Start following users to see them here"}
              </p>
            </div>
          ) : activeTab === "followers" ? (
            <FollowersList
              users={followers}
              isLoading={isLoading}
              searchTerm={searchTerm}
            />
          ) : (
            <FollowingList
              users={following}
              isLoading={isLoading}
              searchTerm={searchTerm}
            />
          )}
        </div>
      </div>
    </div>
  );
}
