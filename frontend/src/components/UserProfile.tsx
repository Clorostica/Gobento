import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { ArrowLeft } from "lucide-react";
import type { Event } from "@/types/tasks/task.types";
import EventFilter from "./TaskFilter";
import PixelBlast from "./PixelBlast";
import Header from "./Header";
import ReadOnlyTodoList from "./ReadOnlyTodoList";

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

      // Load user profile info
      const profileRes = await fetch(`${API_URL}/events/user/${userId}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!profileRes.ok) {
        const errorData = await profileRes.json();
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
      // Los "followers" del backend son en realidad los amigos (following) del usuario
      setFriends(profileData.followers || []);

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
        <header className="sticky top-0 z-50 w-full px-6 py-4 backdrop-blur-md bg-black/80 border-b border-gray-700 shadow-md">
          <div className="w-full sm:max-w-7xl sm:mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-5">
            <div className="flex items-center justify-between mb-2 sm:mb-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/")}
                  className="text-white hover:text-purple-300 transition-colors p-2"
                  title="Go back"
                >
                  <ArrowLeft size={24} />
                </button>

                <div className="flex items-center gap-3">
                  {profile.picture ? (
                    <img
                      src={profile.picture}
                      alt={profile.username || profile.name || profile.email}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold ring-2 ring-purple-500">
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
                  <div>
                    <h1 className="text-white font-bold text-xl">
                      {profile.username ? profile.username : profile.email}
                    </h1>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Header token={token} API_URL={API_URL} userId={userId} />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
          <ReadOnlyTodoList todos={events} search={search} filter={filter} />
        </main>
      </div>
    </div>
  );
}
