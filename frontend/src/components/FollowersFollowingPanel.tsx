import { useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Users, UserPlus, X } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"followers" | "following">("following");
  const [searchTerm, setSearchTerm] = useState("");
  const { isAuthenticated } = useAuth0();

  const loadFollowersAndFollowing = useCallback(async () => {
    if (!token || !isAuthenticated) return;
    setIsLoading(true);
    try {
      const url = userId
        ? `${API_URL}/friends/followers-following/${userId}`
        : `${API_URL}/friends/followers-following`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setFollowing(data.following || []);
        setFollowers(data.followers || []);
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
    const q = searchTerm.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="absolute right-0 mt-2 w-80 rounded-xl overflow-hidden z-50 flex flex-col"
      style={{
        background: "rgba(5,0,20,0.97)",
        border: "1px solid rgba(139,92,246,0.25)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        backdropFilter: "blur(16px)",
        maxHeight: "520px",
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b" style={{ borderColor: "rgba(139,92,246,0.15)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-semibold text-sm">Connections</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
          {(["following", "followers"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab ? "text-white" : "text-white/40 hover:text-white/70"
              }`}
              style={activeTab === tab ? {
                background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(168,85,247,0.2))",
                boxShadow: "0 1px 8px rgba(139,92,246,0.2)",
              } : undefined}
            >
              {tab === "followers" ? <Users size={12} /> : <UserPlus size={12} />}
              <span className="capitalize">{tab}</span>
              <span className={`text-[10px] px-1 py-0.5 rounded-full ${
                activeTab === tab ? "bg-purple-500/30 text-purple-300" : "bg-white/10 text-white/40"
              }`}>
                {tab === "followers" ? followers.length : following.length}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mt-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs text-white placeholder-white/30 outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(139,92,246,0.2)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(139,92,246,0.2)")}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mb-2" />
            <p className="text-xs text-white/40">Loading...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: "rgba(139,92,246,0.1)" }}>
              {activeTab === "followers" ? (
                <Users className="text-purple-400/60" size={18} />
              ) : (
                <UserPlus className="text-purple-400/60" size={18} />
              )}
            </div>
            <p className="text-xs font-medium text-white/50 mb-1">
              {searchTerm ? "No results" : activeTab === "followers" ? "No followers yet" : "Not following anyone"}
            </p>
            <p className="text-xs text-white/25">
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
  );
}
