import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { ArrowLeft } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import type { Event } from "@/types/tasks/task.types";
import Header from "./Header";
import ReadOnlyTodoList from "./ReadOnlyTodoList";
import StarBorder from "./StarBorder";
import { COLOR_CLASSES } from "@/config/constants";

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
    "all" | "planned" | "upcoming" | "happened" | "private" | "liked"
  >("all");
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [modalDismissed, setModalDismissed] = useState<boolean>(false);
  const [copiedEventIds, setCopiedEventIds] = useState<Set<string>>(new Set());
  const [copyingEventId, setCopyingEventId] = useState<string | null>(null);

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

      // Check which events from this profile are already in the user's events
      // by fetching user's events and comparing them
      try {
        const userEventsRes = await fetch(`${API_URL}/events`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });

        if (userEventsRes.ok) {
          const userEventsData = await userEventsRes.json();
          const userEvents = userEventsData.events || [];

          // Find events in user's list that are shared from this profile's user
          const copiedEventIdsSet = new Set<string>();

          convertedEvents.forEach((profileEvent: Event) => {
            // Use original_event_id to directly match events
            const matchingEvent = userEvents.find((userEvent: any) => {
              const originalEventId =
                userEvent.original_event_id || userEvent.originalEventId;
              return originalEventId === profileEvent.id;
            });

            if (matchingEvent) {
              copiedEventIdsSet.add(profileEvent.id);
              console.log("✅ Found copied event by original_event_id:", {
                profileEventId: profileEvent.id,
                copiedEventId: matchingEvent.id,
                originalEventId:
                  matchingEvent.original_event_id ||
                  matchingEvent.originalEventId,
              });
            }
          });

          setCopiedEventIds(copiedEventIdsSet);
          console.log(
            `✅ Found ${copiedEventIdsSet.size} events already copied from this user:`,
            Array.from(copiedEventIdsSet)
          );
        } else {
          // If we can't fetch user events, use empty set
          setCopiedEventIds(new Set());
        }
      } catch (error) {
        console.error("Error checking copied events:", error);
        setCopiedEventIds(new Set());
      }

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
      // Reset modal dismissed state when visiting a new profile
      setModalDismissed(false);
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
      !showFollowModal &&
      !modalDismissed
    ) {
      setShowFollowModal(true);
    }
  }, [
    isLoading,
    profile,
    isFollowing,
    isOwnProfile,
    showFollowModal,
    modalDismissed,
  ]);

  const handleFollowToggle = async () => {
    if (!token || !userId) return;

    // Si ya está siguiendo, unfollow directamente
    if (isFollowing) {
      await executeFollowToggle(true);
    } else {
      // Si no está siguiendo, seguir directamente (acción explícita del usuario)
      await executeFollowToggle(false);
    }
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

  const handleCopyEvent = useCallback(
    async (event: Event) => {
      if (!token) {
        alert("You must be authenticated to copy events");
        return;
      }

      // If already copied, remove it (uncopy)
      if (copiedEventIds.has(event.id)) {
        setCopyingEventId(event.id);
        try {
          // Get all user events to find the copied one
          const eventsRes = await fetch(`${API_URL}/events`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!eventsRes.ok) {
            throw new Error("Failed to fetch events");
          }

          const responseData = await eventsRes.json();
          const userEvents = responseData.events || [];

          console.log("📥 Fetched user events:", {
            count: userEvents.length,
            events: userEvents.map((e: any) => ({
              id: e.id,
              title: e.title,
              shared_from_user_id: e.shared_from_user_id,
              sharedFromUserId: e.sharedFromUserId,
            })),
          });

          // Find the copied event by original_event_id (much simpler and more reliable)
          const copiedEvent = userEvents.find((e: any) => {
            const originalEventId = e.original_event_id || e.originalEventId;
            return originalEventId === event.id;
          });

          console.log("🔍 Looking for copied event by original_event_id:", {
            originalEventId: event.id,
            foundEvent: copiedEvent
              ? {
                  id: copiedEvent.id,
                  original_event_id:
                    copiedEvent.original_event_id ||
                    copiedEvent.originalEventId,
                }
              : null,
          });

          if (copiedEvent) {
            // Delete the copied event
            const deleteRes = await fetch(
              `${API_URL}/events/${copiedEvent.id}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (!deleteRes.ok) {
              throw new Error("Failed to remove event");
            }

            console.log("✅ Event removed successfully");
          } else {
            console.warn(
              "⚠️ Copied event not found, but removing from copied state anyway"
            );
          }

          // Always remove from copied state, even if event wasn't found
          // This ensures the button goes back to "+" state
          setCopiedEventIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(event.id);
            console.log("🔄 Updated copiedEventIds:", {
              removedId: event.id,
              newSize: newSet.size,
              hasId: newSet.has(event.id),
            });
            return newSet;
          });
        } catch (error) {
          console.error("❌ Error removing event:", error);
          alert(
            error instanceof Error
              ? error.message
              : "Failed to remove event. Please try again."
          );
        } finally {
          setCopyingEventId(null);
        }
        return;
      }

      // Check if already in copied state (prevent duplicate clicks)
      if (copiedEventIds.has(event.id)) {
        console.log("⚠️ Event already marked as copied, skipping");
        setCopyingEventId(null);
        return;
      }

      // Set copying state immediately to prevent duplicate clicks
      setCopyingEventId(event.id);

      // Optimistically update state to prevent duplicate clicks
      // We'll revert if the operation fails
      setCopiedEventIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(event.id);
        console.log("🔄 Optimistically updated copiedEventIds:", {
          eventId: event.id,
          newSize: newSet.size,
        });
        return newSet;
      });

      try {
        // First, check if this event already exists in user's events
        // to prevent duplicates
        const eventsRes = await fetch(`${API_URL}/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!eventsRes.ok) {
          throw new Error("Failed to fetch events");
        }

        const responseData = await eventsRes.json();
        const userEvents = responseData.events || [];

        // Check if event already exists by original_event_id
        const existingEvent = userEvents.find((e: any) => {
          const originalEventId = e.original_event_id || e.originalEventId;
          return originalEventId === event.id;
        });

        if (existingEvent) {
          console.log("⚠️ Event already exists by original_event_id:", {
            originalEventId: event.id,
            existingEventId: existingEvent.id,
            original_event_id:
              existingEvent.original_event_id || existingEvent.originalEventId,
          });
          // Event already exists, just mark it as copied in the UI
          setCopiedEventIds((prev) => new Set(prev).add(event.id));
          setCopyingEventId(null);
          return;
        }

        // Generate new ID for the copied event
        const newEventId = uuidv4();

        // Get random color class if event doesn't have one
        const getRandomColorClass = (): string => {
          const index = Math.floor(Math.random() * COLOR_CLASSES.length);
          return COLOR_CLASSES[index] || COLOR_CLASSES[0];
        };
        const colorClass = event.colorClass || getRandomColorClass();

        // Get first image URL if images exist
        const images = event.images || [];
        const imageUrl = (event as any).imageUrl || (event as any).image_url;
        const firstImageUrl = images.length > 0 ? images[0] : imageUrl || null;

        // Prepare event data for API
        // Mark as shared from the user whose profile we're viewing
        // Store the original event ID to track which event was copied
        const eventData = {
          id: newEventId,
          status: event.status || "planned",
          text: event.text || null,
          title: event.title || null,
          colorClass: colorClass as string,
          address: event.address || null,
          dueDate: event.dueDate || null,
          startTime: event.startTime || null,
          image_url: firstImageUrl,
          sharedFromUserId: userId || null, // Mark as shared from this user
          originalEventId: event.id, // Store the original event ID
        };

        console.log("📋 Copying event:", {
          eventId: eventData.id,
          originalEventId: eventData.originalEventId,
          sharedFromUserId: eventData.sharedFromUserId,
        });

        const response = await fetch(`${API_URL}/events`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("❌ Copy event failed:", errorData);
          throw new Error(errorData.error || "Failed to copy event");
        }

        const createdEvent = await response.json();
        console.log("✅ Event copied successfully:", createdEvent);

        // State is already updated optimistically, just clear copying state
        console.log("✅ Event created, state already updated optimistically");
      } catch (error) {
        console.error("❌ Error copying event:", error);

        // Revert optimistic update on error
        setCopiedEventIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(event.id);
          console.log("🔄 Reverted copiedEventIds due to error:", {
            eventId: event.id,
            newSize: newSet.size,
          });
          return newSet;
        });

        alert(
          error instanceof Error
            ? error.message
            : "Failed to copy event. Please try again."
        );
      } finally {
        // Clear copying state
        setCopyingEventId(null);
      }
    },
    [token, copiedEventIds, userId, API_URL]
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 sm:space-y-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-700 font-medium text-base sm:text-lg md:text-xl">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 font-medium mb-4 sm:mb-6 text-base sm:text-lg md:text-xl">
            User not found
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-base sm:text-lg md:text-xl font-semibold touch-manipulation transition-colors"
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
          <div className="w-full sm:max-w-7xl sm:mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-5 md:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 md:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => navigate("/")}
                  className="text-white hover:text-purple-300 transition-colors p-2 sm:p-2.5 md:p-3 flex-shrink-0 touch-manipulation"
                  title="Go back"
                >
                  <ArrowLeft
                    size={22}
                    className="sm:w-6 sm:h-6 md:w-7 md:h-7"
                  />
                </button>

                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 sm:flex-initial">
                  {profile.picture ? (
                    <img
                      src={profile.picture}
                      alt={profile.username || profile.name || profile.email}
                      className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full object-cover ring-2 ring-purple-500 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold ring-2 ring-purple-500 flex-shrink-0 text-base sm:text-lg md:text-xl">
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
                    <h1 className="text-white font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl truncate">
                      {profile.username ? profile.username : profile.email}
                    </h1>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 w-full sm:w-auto justify-end sm:justify-start">
                <StarBorder
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  color={isFollowing ? "#9CA3AF" : "#B19EEF"}
                  speed="6s"
                  thickness={2}
                  className="font-semibold shadow-lg transition-colors duration-300 flex items-center gap-2 text-base sm:text-lg md:text-xl px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 touch-manipulation"
                  title={isFollowing ? "Unfollow user" : "Follow user"}
                >
                  {isFollowLoading ? (
                    <>
                      <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-10 lg:py-12 flex-grow w-full">
          <ReadOnlyTodoList
            todos={events}
            search={search}
            filter={filter}
            isFollowing={isFollowing}
            onCopyEvent={handleCopyEvent}
            copiedEventIds={copiedEventIds}
            copyingEventId={copyingEventId}
          />
        </main>
      </div>

      {/* Follow Confirmation Modal */}
      {showFollowModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8 pointer-events-none">
          {/* Overlay - No bloquea interacciones */}
          <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>

          {/* Modal Content - Centered */}
          <div
            className="relative bg-black/90 backdrop-blur-md border border-purple-500/30 rounded-[20px] sm:rounded-[24px] p-6 sm:p-8 md:p-10 max-w-md sm:max-w-lg md:max-w-xl w-full shadow-2xl z-10 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white font-bold text-xl sm:text-2xl md:text-3xl mb-4 sm:mb-5 md:mb-6 text-center">
              Follow User
            </h2>
            <p className="text-white/80 text-center mb-6 sm:mb-8 md:mb-10 text-base sm:text-lg md:text-xl leading-relaxed">
              Do you want to follow{" "}
              <span className="font-semibold text-purple-300">
                {profile?.username || profile?.name || profile?.email}
              </span>
              ?
            </p>

            <div className="flex gap-3 sm:gap-4 md:gap-5 justify-center">
              <StarBorder
                onClick={() => {
                  setShowFollowModal(false);
                  setModalDismissed(true);
                }}
                color="#9CA3AF"
                speed="6s"
                thickness={2}
                className="font-semibold shadow-lg transition-colors duration-300 flex items-center gap-2 text-base sm:text-lg md:text-xl px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-3.5 touch-manipulation"
              >
                Cancel
              </StarBorder>
              <StarBorder
                onClick={() => executeFollowToggle(false)}
                disabled={isFollowLoading}
                color="#B19EEF"
                speed="6s"
                thickness={2}
                className="font-semibold shadow-lg transition-colors duration-300 flex items-center gap-2 text-base sm:text-lg md:text-xl px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-3.5 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                {isFollowLoading ? (
                  <>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
