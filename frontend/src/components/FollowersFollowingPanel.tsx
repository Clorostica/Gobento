import React, { useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Users, UserPlus, Search, X } from "lucide-react";
import FollowersList from "./FollowersList";
import FollowingList from "./FollowingList";

interface User {
  id: string;
  email: string;
  name?: string;
  username?: string | null;
  picture?: string;
  isFollowing?: boolean;
}

interface FollowersFollowingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  API_URL: string;
  userId?: string | undefined;
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
        // Following: gente que el usuario sigue (lo mismo que se muestra en "Friends")
        const followingList = data.following || [];
        // Followers: gente que sigue al usuario
        const followersList = data.followers || [];

        setFollowing(followingList);
        setFollowers(followersList);
      }
    } catch (error) {
      console.error("Error loading followers/following:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token, API_URL, isAuthenticated, userId]);

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
      className="fixed inset-0 flex items-start justify-center z-50 pt-16 sm:pt-20 px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md h-[72vh] flex flex-col rounded-2xl overflow-hidden border border-purple-900/50 shadow-2xl shadow-purple-900/30"
        style={{ background: "rgba(5,0,20,0.97)", backdropFilter: "blur(20px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-purple-900/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-base">Connections</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 p-1 rounded-lg mb-3" style={{ background: "rgba(255,255,255,0.05)" }}>
            {(["followers", "following"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === tab
                    ? "text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
                style={activeTab === tab ? {
                  background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(168,85,247,0.2))",
                  boxShadow: "0 1px 8px rgba(139,92,246,0.2)",
                } : undefined}
              >
                {tab === "followers" ? <Users size={14} /> : <UserPlus size={14} />}
                <span className="capitalize">{tab}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab
                    ? "bg-purple-500/30 text-purple-300"
                    : "bg-white/10 text-white/40"
                }`}>
                  {tab === "followers" ? followers.length : following.length}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={15} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500/60 transition-all"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(139,92,246,0.2)" }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mb-3" />
              <p className="text-sm text-white/40">Loading...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(139,92,246,0.1)" }}>
                {searchTerm ? (
                  <Search className="text-purple-400/60" size={22} />
                ) : activeTab === "followers" ? (
                  <Users className="text-purple-400/60" size={22} />
                ) : (
                  <UserPlus className="text-purple-400/60" size={22} />
                )}
              </div>
              <p className="text-sm font-medium text-white/60 mb-1">
                {searchTerm ? "No results" : activeTab === "followers" ? "No followers yet" : "Not following anyone"}
              </p>
              <p className="text-xs text-white/30">
                {searchTerm ? "Try a different term" : activeTab === "followers" ? "Share your events to gain followers" : "Follow people to see them here"}
              </p>
            </div>
          ) : activeTab === "followers" ? (
            <FollowersList users={followers} isLoading={isLoading} searchTerm={searchTerm} />
          ) : (
            <FollowingList users={following} isLoading={isLoading} searchTerm={searchTerm} />
          )}
        </div>
      </div>
    </div>
  );
}
