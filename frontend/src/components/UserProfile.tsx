import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { ArrowLeft } from "lucide-react";
import type { Event } from "@/types/tasks/task.types";
import EventFilter from "./TaskFilter";
import Header from "./Header";
import ReadOnlyTodoList from "./ReadOnlyTodoList";
import StarBorder from "./StarBorder";

interface UserProfileData {
  id: string;
  email: string;
  name?: string | null;
  username?: string | null;
  picture?: string | null;
  is_private?: boolean;
  isMutualFriend?: boolean;
}

const API_URL = import.meta.env.VITE_API as string;

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const {
    user,
    getIdTokenClaims,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth0();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [friends, setFriends] = useState<UserProfileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [filter, setFilter] = useState<
    "all" | "planned" | "upcoming" | "happened" | "liked"
  >("all");
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);

  // Determinar si es el perfil del usuario actual
  const isOwnProfile = user?.sub === userId;

  const loadUserProfile = useCallback(async () => {
    if (!userId || !isAuthenticated) return;

    setIsLoading(true);
    try {
      const tokenClaims = await getIdTokenClaims();
      if (!tokenClaims) return;

      const idToken = tokenClaims.__raw;
      setToken(idToken);

      console.log("🔍 Loading profile for user:", userId);
      console.log("👤 Current user:", user?.sub);
      console.log("🏠 Is own profile:", isOwnProfile);

      // Si es tu propio perfil, redirige a home
      if (isOwnProfile) {
        console.log("⚠️ Redirecting to home - viewing own profile");
        navigate("/");
        return;
      }

      // First check if we're following this user
      let isFollowingUser = false;
      try {
        const followCheckRes = await fetch(
          `${API_URL}/friends/check/${userId}`,
          {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );
        if (followCheckRes.ok) {
          const followData = await followCheckRes.json();
          isFollowingUser = followData.isFollowing || false;
          setIsFollowing(isFollowingUser);
          console.log("✅ Follow status checked:", isFollowingUser);
        } else {
          console.warn(
            "⚠️ Could not check follow status, assuming not following"
          );
          setIsFollowing(false);
        }
      } catch (error) {
        console.error("Error checking follow status:", error);
        // If connection refused, backend might not be running
        if (
          error instanceof TypeError &&
          error.message.includes("Failed to fetch")
        ) {
          console.error("❌ Backend connection error - is the server running?");
        }
        setIsFollowing(false);
      }

      const profileRes = await fetch(`${API_URL}/events/user/${userId}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!profileRes.ok) {
        let errorData;
        try {
          errorData = await profileRes.json();
        } catch (e) {
          // If response is not JSON, might be connection error
          if (profileRes.status === 0 || !profileRes.status) {
            throw new Error(
              "Cannot connect to server. Please make sure the backend is running."
            );
          }
          errorData = { error: "Failed to load profile" };
        }

        // If we're not following, we can still show basic profile info
        if (profileRes.status === 403 || profileRes.status === 404) {
          // Try to get basic user info
          try {
            const userInfoRes = await fetch(`${API_URL}/users/${userId}`, {
              headers: { Authorization: `Bearer ${idToken}` },
            });
            if (userInfoRes.ok) {
              const userInfo = await userInfoRes.json();
              setProfile({
                id: userInfo.id || userId,
                email: userInfo.email || "",
                name: userInfo.name,
                username: userInfo.username,
                picture: userInfo.picture,
              });
            }
          } catch (error) {
            console.error("Error loading user info:", error);
          }
          setEvents([]);
          setFriends([]);
          // Keep the follow status from the check above
          return;
        }
        console.error("❌ Error response:", errorData);
        throw new Error(errorData.error || "Failed to load profile");
      }

      const profileData = await profileRes.json();
      console.log("✅ Profile data loaded:", profileData);

      // Extract user info and events from response
      const userInfo = profileData.user || {};

      // Convert events from snake_case to camelCase and add image_url to images array
      const convertedEvents = (profileData.events || []).map((event: any) => {
        const converted = Object.fromEntries(
          Object.entries(event).map(([key, value]) => [
            key.replace(/_([a-z])/g, (_, letter: string) =>
              letter.toUpperCase()
            ),
            value,
          ])
        ) as Event;

        // If image_url exists, add it to images array
        if (
          converted.image_url &&
          !converted.images?.includes(converted.image_url)
        ) {
          converted.images = [converted.image_url, ...(converted.images || [])];
        }

        return converted;
      }) as Event[];

      setProfile({
        id: userInfo.id || userId,
        email: userInfo.email || "",
        name: userInfo.name,
        username: userInfo.username,
        picture: userInfo.picture,
      });

      setEvents(convertedEvents);
      // Los "followers" del backend son los usuarios que siguen a este usuario
      setFriends(profileData.followers || []);

      // If we can access their events, we must be following them
      // But keep the status from the check above to be consistent
      if (!isFollowingUser) {
        setIsFollowing(true);
      }

      console.log("✅ Friends loaded:", profileData.followers?.length || 0);
    } catch (error) {
      console.error("Error loading user profile:", error);
      // Si el error es de autenticación, redirigir al home
      if (error instanceof Error) {
        if (error.message.includes("not your friend")) {
          alert("You need to be friends with this user to view their profile");
          navigate("/");
        } else if (error.message.includes("Failed to load profile")) {
          alert("Could not load user profile");
          navigate("/");
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    userId,
    isAuthenticated,
    getIdTokenClaims,
    isOwnProfile,
    user?.sub,
    navigate,
  ]);

  useEffect(() => {
    if (isAuthenticated && !authLoading && userId) {
      loadUserProfile();
    }
  }, [isAuthenticated, authLoading, userId, loadUserProfile]);

  // Mostrar modal automáticamente cuando se carga el perfil y no se está siguiendo
  useEffect(() => {
    if (
      !isLoading &&
      profile &&
      !isFollowing &&
      !isOwnProfile &&
      !showFollowModal
    ) {
      setShowFollowModal(true);
    }
  }, [isLoading, profile, isFollowing, isOwnProfile, showFollowModal]);

  const handleFollowToggle = async () => {
    if (!token || !userId) return;

    // Si ya está siguiendo, unfollow directamente
    if (isFollowing) {
      await executeFollowToggle(true);
    }
    // Si no está siguiendo, el modal ya debería estar visible
  };

  const executeFollowToggle = async (isUnfollow: boolean = false) => {
    if (!token || !userId) return;

    setIsFollowLoading(true);
    const wasFollowing = isFollowing;

    try {
      const endpoint = isUnfollow
        ? `${API_URL}/events/unfollow/${userId}`
        : `${API_URL}/events/follow/${userId}`;

      console.log(
        `🔄 ${isUnfollow ? "Unfollowing" : "Following"} user ${userId}`
      );

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Follow/unfollow failed:", errorData);
        throw new Error(errorData.error || "Failed to update follow status");
      }

      const responseData = await response.json().catch(() => ({}));
      console.log("✅ Follow/unfollow successful:", responseData);

      // Update following state immediately (optimistic update)
      const newFollowingState = !isUnfollow;
      setIsFollowing(newFollowingState);
      console.log(`✅ State updated: isFollowing = ${newFollowingState}`);

      // If we just followed, reload the profile to get events
      if (newFollowingState) {
        console.log("🔄 Reloading profile to get events...");
        await loadUserProfile();
      } else {
        // If we unfollowed, clear events since we can't see them anymore
        console.log("🔄 Clearing events (unfollowed)");
        setEvents([]);
      }
    } catch (error) {
      console.error("❌ Error toggling follow:", error);
      // Revert state on error
      setIsFollowing(wasFollowing);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update follow status"
      );
    } finally {
      setIsFollowLoading(false);
      setShowFollowModal(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-700 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 font-medium mb-4">User not found</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{}}>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
        }}
      ></div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-black/80 border-b border-gray-700 shadow-md">
          <div className="w-full sm:max-w-7xl sm:mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <button
                  onClick={() => navigate("/")}
                  className="text-white hover:text-purple-300 transition-colors p-1.5 sm:p-2 flex-shrink-0"
                  title="Go back"
                >
                  <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
                </button>

                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
                  {profile.picture ? (
                    <img
                      src={profile.picture}
                      alt={profile.username || profile.name || profile.email}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-purple-500 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold ring-2 ring-purple-500 flex-shrink-0 text-sm sm:text-base">
                      {(
                        profile.username ||
                        profile.name ||
                        profile.email ||
                        "U"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h1 className="text-white font-bold text-base sm:text-xl truncate">
                      {profile.username ? profile.username : profile.email}
                    </h1>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end sm:justify-start">
                <StarBorder
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  color={isFollowing ? "#9CA3AF" : "#B19EEF"}
                  speed="6s"
                  thickness={2}
                  className="font-semibold shadow-lg transition-colors duration-300 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title={isFollowing ? "Unfollow user" : "Follow user"}
                >
                  {isFollowLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Loading...</span>
                    </>
                  ) : isFollowing ? (
                    "Following"
                  ) : (
                    "Follow"
                  )}
                </StarBorder>
                <div className="flex-shrink-0">
                  <Header
                    token={token}
                    API_URL={API_URL}
                    userId={userId}
                    showConnections={isFollowing}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex-grow w-full">
          <ReadOnlyTodoList
            todos={events}
            search={search}
            filter={filter}
            isFollowing={isFollowing}
          />
        </main>
      </div>

      {/* Follow Confirmation Modal */}
      {showFollowModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
          {/* Overlay - No bloquea interacciones */}
          <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>

          {/* Modal Content - Centered */}
          <div
            className="relative bg-black/90 backdrop-blur-md border border-purple-500/30 rounded-[20px] p-6 sm:p-8 max-w-md w-full shadow-2xl z-10 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white font-bold text-xl sm:text-2xl mb-4 text-center">
              Follow User
            </h2>
            <p className="text-white/80 text-center mb-6 text-sm sm:text-base">
              Do you want to follow{" "}
              <span className="font-semibold text-purple-300">
                {profile?.username || profile?.name || profile?.email}
              </span>
              ?
            </p>

            <div className="flex gap-3 sm:gap-4 justify-center">
              <StarBorder
                onClick={() => setShowFollowModal(false)}
                color="#9CA3AF"
                speed="6s"
                thickness={2}
                className="font-semibold shadow-lg transition-colors duration-300 flex items-center gap-2 text-sm sm:text-base px-6 py-2.5"
              >
                Cancel
              </StarBorder>
              <StarBorder
                onClick={() => executeFollowToggle(false)}
                disabled={isFollowLoading}
                color="#B19EEF"
                speed="6s"
                thickness={2}
                className="font-semibold shadow-lg transition-colors duration-300 flex items-center gap-2 text-sm sm:text-base px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFollowLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  "Follow"
                )}
              </StarBorder>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
