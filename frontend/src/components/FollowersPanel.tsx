import React, { useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";

interface Follower {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

interface FollowersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  API_URL: string;
}

export default function FollowersPanel({
  isOpen,
  onClose,
  token,
  API_URL,
}: FollowersPanelProps) {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [searchEmail, setSearchEmail] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Follower[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth0();

  const loadFollowers = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFollowers(data.friends || []);
      }
    } catch (error) {
      console.error("Error loading followers:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    if (isOpen && token) {
      loadFollowers();
    }
  }, [isOpen, token, loadFollowers]);

  const searchUsers = useCallback(
    async (email: string) => {
      if (!email || !token) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `${API_URL}/users/search?email=${encodeURIComponent(email)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Filter out current user and already followed users
          const followerIds = new Set(followers.map((f) => f.id));
          const filtered = (data.users || []).filter(
            (u: Follower) => u.id !== user?.sub && !followerIds.has(u.id)
          );
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setIsSearching(false);
      }
    },
    [token, API_URL, followers, user]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchEmail) {
        searchUsers(searchEmail);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchEmail, searchUsers]);

  const followUser = useCallback(
    async (followerId: string) => {
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/friends`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ friendId: followerId }),
        });

        if (response.ok) {
          await loadFollowers();
          setSearchEmail("");
          setSearchResults([]);
        } else {
          alert("Failed to follow user. Please try again.");
        }
      } catch (error) {
        console.error("Error following user:", error);
        alert("Error following user. Please try again.");
      }
    },
    [token, API_URL, loadFollowers]
  );

  const unfollowUser = useCallback(
    async (followerId: string) => {
      if (!token) return;

      if (!confirm("Are you sure you want to unfollow this user?")) return;

      try {
        const response = await fetch(`${API_URL}/friends/${followerId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          await loadFollowers();
        } else {
          alert("Failed to unfollow user. Please try again.");
        }
      } catch (error) {
        console.error("Error unfollowing user:", error);
        alert("Error unfollowing user. Please try again.");
      }
    },
    [token, API_URL, loadFollowers]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">👥 Followers</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Search by email
            </label>
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Enter email address..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />

            {/* Search Results */}
            {isSearching && (
              <div className="text-center text-sm text-gray-500 py-2">
                Searching...
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2 mt-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.email}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">
                          {user.name || user.email}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => followUser(user.id)}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Followers List */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">My Followers</h3>
            {isLoading ? (
              <div className="text-center text-sm text-gray-500 py-4">
                Loading followers...
              </div>
            ) : followers.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-4">
                No followers yet. Search above to follow users!
              </div>
            ) : (
              <div className="space-y-2">
                {followers.map((follower) => (
                  <div
                    key={follower.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {follower.picture ? (
                        <img
                          src={follower.picture}
                          alt={follower.email}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold">
                          {follower.email.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">
                          {follower.name || follower.email}
                        </p>
                        <p className="text-xs text-gray-500">{follower.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => unfollowUser(follower.id)}
                      className="px-3 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                    >
                      Unfollow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

