import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { getEvents, saveEvents } from "../utils/storage";
import type { Event } from "../types/tasks/task.types";
import Header from "../components/Header";
import TodoList from "../components/TodoList";
import Search from "../components/Search";
import EventFilter from "../components/TaskFilter";
import {
  requestNotificationPermission,
  checkOverdueEvents,
} from "../utils/notifications";
import { useAuth, useApiClient } from "../hooks";
import { EventsService, UsersService } from "../services";
import { env } from "../config/env";
import { UsernameModal } from "../components/ui";
import { COLOR_CLASSES } from "../config/constants";

interface Profile {
  id: string;
  email: string;
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  isPrivate: boolean;
}

export default function HomePage() {
  const { user, isAuthenticated, logout } = useAuth0();
  const { token, isLoading } = useAuth();
  const apiClient = useApiClient();
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState<string>("");
  const [searchType, setSearchType] = useState<"events" | "users">("events");
  const [filter, setFilter] = useState<
    | "all"
    | "planned"
    | "upcoming"
    | "happened"
    | "private"
    | "liked"
    | "friends"
  >((location.state as any)?.filter || "all");
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [searchUsers, setSearchUsers] = useState<Profile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isNewlyCreatedUser, setIsNewlyCreatedUser] = useState(false);

  const eventsService = useMemo(
    () => new EventsService(apiClient),
    [apiClient]
  );
  const usersService = useMemo(() => new UsersService(apiClient), [apiClient]);

  const createUser = useCallback(async () => {
    if (!token) return;

    try {
      // Check if user exists
      const existingUser = await usersService.getCurrentUser();
      if (existingUser.email && existingUser.id) {
        setProfile({
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name ?? null,
          username: existingUser.username ?? null,
          avatarUrl:
            (existingUser as any).avatar_url ||
            (existingUser as any).avatarUrl ||
            null,
          isPrivate: existingUser.isPrivate ?? false,
        });
        // Don't show modal for existing users
        setIsNewlyCreatedUser(false);
        return;
      }
    } catch (error) {
      // User doesn't exist, continue to create
    }

    try {
      // Create new user
      console.log("Creating new user with data:", {
        email: user?.email,
        picture: user?.picture,
      });
      const newUser = await usersService.createUser({
        email: user?.email || "",
        avatarUrl: user?.picture || "",
      });
      console.log("User created successfully:", newUser);
      if (newUser.id) {
        setProfile({
          id: newUser.id,
          email: newUser.email || user?.email || "",
          name: newUser.name ?? user?.name ?? null,
          username: newUser.username ?? null,
          avatarUrl:
            (newUser as any).avatar_url || (newUser as any).avatarUrl || null,
          isPrivate: newUser.isPrivate ?? false,
        });
        // Mark as newly created and show modal
        setIsNewlyCreatedUser(true);
        setShowUsernameModal(true);
      }
    } catch (error) {
      console.error("❌ Error creating user:", error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      setIsNewlyCreatedUser(false);
    }
  }, [token, usersService, user]);

  const loadEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      // If user is authenticated, load from API
      if (isAuthenticated && token) {
        const events = await eventsService.getAllEvents();
        setEvents(events);
      }
      // Only load from localStorage if NOT authenticated and NOT loading
      else if (!isAuthenticated && !isLoading) {
        const localEvents = getEvents();
        setEvents(localEvents);
      }
      // If authentication is loading, wait without loading anything
      else {
        setEvents([]);
      }
    } catch (err) {
      console.error("❌ Error loading events:", err);
      // On error:
      // - If authenticated: keep events empty (don't use localStorage)
      // - If not authenticated: load from localStorage as fallback
      if (isAuthenticated) {
        setEvents([]);
      } else if (!isLoading) {
        const localEvents = getEvents();
        setEvents(localEvents);
      } else {
        setEvents([]);
      }
    } finally {
      setIsLoadingEvents(false);
    }
  }, [isAuthenticated, isLoading, token, eventsService]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Update filter if coming from UserProfile with friends filter
  useEffect(() => {
    if ((location.state as any)?.filter === "friends") {
      setFilter("friends");
      // Reload events to show the newly copied event
      loadEvents();
      // Clear the state to avoid keeping it on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, loadEvents]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      createUser();
    }
  }, [isAuthenticated, isLoading, user, createUser]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Search users when searchType is "users" (with or without search term)
  useEffect(() => {
    if (searchType !== "users" || !token) {
      setSearchUsers([]);
      setIsSearchingUsers(false);
      return;
    }

    const searchUsersDebounced = async () => {
      setIsSearchingUsers(true);
      try {
        // If there's a search term, include it in the query, otherwise send empty string
        const queryParam = search.trim()
          ? `?q=${encodeURIComponent(search.trim())}`
          : "?q=";
        const response = await fetch(
          `${env.API_URL}/users/search${queryParam}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Backend already filters out current user, but double-check just in case
          const users = (data.users || [])
            .filter((u: any) => u.id !== user?.sub)
            .map((u: any) => ({
              id: u.id,
              email: u.email,
              username: u.username || null,
              name: u.name || null,
              avatarUrl: u.avatar_url || u.avatarUrl || null,
              isPrivate: u.isPrivate || false,
            }));
          setSearchUsers(users);
        } else {
          setSearchUsers([]);
        }
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchUsers([]);
      } finally {
        setIsSearchingUsers(false);
      }
    };

    const timeoutId = setTimeout(searchUsersDebounced, search.trim() ? 300 : 0);
    return () => clearTimeout(timeoutId);
  }, [search, searchType, token, env.API_URL, user?.sub]);

  useEffect(() => {
    if (events.length === 0) return;

    checkOverdueEvents(events);

    const interval = setInterval(() => {
      checkOverdueEvents(events);
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [events]);

  // Load profile
  const loadProfile = useCallback(async () => {
    if (!token || !isAuthenticated || !user) return;

    try {
      const userData = await usersService.getCurrentUser();
      if (userData.id) {
        setProfile({
          id: userData.id,
          email: userData.email || user.email || "",
          name: userData.name ?? user.name ?? null,
          username: userData.username ?? null,
          avatarUrl:
            (userData as any).avatar_url || (userData as any).avatarUrl || null,
          isPrivate: userData.isPrivate ?? false,
        });
        // Show username modal if user doesn't have a username
        if (!userData.username) {
          setShowUsernameModal(true);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }, [token, isAuthenticated, user, usersService]);

  useEffect(() => {
    if (isAuthenticated && token && user) {
      loadProfile();
    }
  }, [isAuthenticated, token, user, loadProfile]);

  // Only show modal for newly created users
  // Don't show modal for existing users without username

  const handleUsernameSubmit = useCallback(
    async (username: string, avatarUrl?: string | null) => {
      if (!token) return;

      setIsUpdatingUsername(true);
      try {
        const updatedUser = await usersService.updateUsername(
          username,
          avatarUrl
        );
        if (updatedUser.id) {
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  username: updatedUser.username ?? null,
                  avatarUrl:
                    (updatedUser as any).avatar_url ||
                    (updatedUser as any).avatarUrl ||
                    null,
                }
              : null
          );
          setShowUsernameModal(false);
          setIsNewlyCreatedUser(false);
        }
      } catch (error: unknown) {
        console.error("❌ Error updating username:", error);
        // ApiClientError already contains the correct error message
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Failed to set username. Please try again.");
      } finally {
        setIsUpdatingUsername(false);
      }
    },
    [token, usersService]
  );

  const handleCancelUserCreation = useCallback(async () => {
    if (!token || !isNewlyCreatedUser) return;

    try {
      await usersService.deleteUser();
      setProfile(null);
      setShowUsernameModal(false);
      setIsNewlyCreatedUser(false);
      // Logout the user since we're deleting their account
      logout({ logoutParams: { returnTo: window.location.origin } });
    } catch (error) {
      console.error("❌ Error deleting user:", error);
      // Even if deletion fails, close the modal and logout
      setShowUsernameModal(false);
      setIsNewlyCreatedUser(false);
      logout({ logoutParams: { returnTo: window.location.origin } });
    }
  }, [token, isNewlyCreatedUser, usersService, logout]);

  const getRandomColorClass = (): string => {
    const index = Math.floor(Math.random() * COLOR_CLASSES.length);
    return COLOR_CLASSES[index] || COLOR_CLASSES[0];
  };

  const handleAddEvent = useCallback(
    async (status?: "planned" | "upcoming" | "happened" | "private") => {
      const eventStatus = status || "planned";
      const newEvent: Event = {
        id: uuidv4(),
        status: eventStatus,
        text: "",
        title: null,
        address: null,
        dueDate: null,
        startTime: null,
        colorClass: getRandomColorClass(),
        images: [],
        liked: false,
      };

      setEvents((prev) => [newEvent, ...prev]);

      if (!isAuthenticated) {
        const existingEvents = getEvents();
        const eventForStorage: Event = {
          id: newEvent.id,
          status: newEvent.status,
          colorClass: newEvent.colorClass,
          title: newEvent.title ?? null,
          text: newEvent.text ?? null,
          dueDate: newEvent.dueDate ?? null,
          startTime: newEvent.startTime ?? null,
          address: newEvent.address ?? null,
          images: newEvent.images || [],
          liked: newEvent.liked || false,
        };
        saveEvents([eventForStorage, ...existingEvents]);
        return;
      }

      try {
        if (!token) {
          throw new Error("No authentication token available");
        }

        const eventData = {
          id: newEvent.id,
          status: newEvent.status,
          text: newEvent.text || null,
          title: newEvent.title || null,
          colorClass: newEvent.colorClass,
          address: newEvent.address || null,
          dueDate: newEvent.dueDate || null,
          startTime: newEvent.startTime || null,
          image_url: null,
        };

        await eventsService.createEvent(eventData);
      } catch (error) {
        setEvents((prev) => prev.filter((event) => event.id !== newEvent.id));
        console.error("❌ Error creating event:", error);
        alert("Oops! Something went wrong creating your event 😕");
      }
    },
    [isAuthenticated, token, eventsService]
  );

  if (isLoading) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 10,
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-700 font-medium">
              Loading your workspace...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{}}>
      {/* Content Layer */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header className="sticky top-0 z-50 w-full px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 backdrop-blur-md bg-black/80 border-b border-gray-700 shadow-md">
          <div className="w-full sm:max-w-7xl sm:mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-1 sm:py-2 md:py-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-2 sm:mb-0">
              {/* Primera línea: Logo, título y botones */}
              <div className="flex flex-row items-center justify-center w-full sm:order-1 gap-1.5 sm:gap-3 md:gap-4 lg:gap-6">
                {/* Logo y título */}
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 flex-shrink-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        />
                      </svg>
                    </div>

                    <Link to="/" className="no-underline">
                      <h1 className="text-white font-bold text-base sm:text-lg md:text-xl flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                        Gobento
                      </h1>
                    </Link>
                  </div>
                  <div className="hidden sm:block sm:ml-2 md:ml-3 lg:ml-4">
                    <Search
                      search={search}
                      setSearch={setSearch}
                      searchType={searchType}
                      onSearchTypeChange={setSearchType}
                    />
                  </div>
                </div>

                {/* Botones de header */}
                <div className="flex-shrink-0">
                  <Header token={token} API_URL={env.API_URL} />
                </div>
              </div>

              {/* Buscador en línea completa solo en móviles */}
              <div className="w-full sm:hidden">
                <Search
                  search={search}
                  setSearch={setSearch}
                  searchType={searchType}
                  onSearchTypeChange={setSearchType}
                />
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
          {/* Show user search results when searching for users */}
          {searchType === "users" ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">
                {isSearchingUsers
                  ? "Loading users..."
                  : search.trim()
                  ? `Found ${searchUsers.length} user${
                      searchUsers.length !== 1 ? "s" : ""
                    }`
                  : `All users (${searchUsers.length})`}
              </h2>
              {isSearchingUsers ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
              ) : searchUsers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {searchUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => navigate(`/user/${user.id}`)}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 cursor-pointer hover:bg-white/20 transition-all duration-200 border border-white/20 hover:border-white/40"
                    >
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.username || user.email}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {user.username
                              ? user.username.charAt(0).toUpperCase()
                              : user.email.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold truncate">
                            {user.username || user.email}
                          </p>
                          {user.username && (
                            <p className="text-gray-400 text-sm truncate">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-lg">
                    {search.trim()
                      ? `No users found matching "${search}"`
                      : "No users found in the system yet."}
                  </p>
                </div>
              )}
            </div>
          ) : isLoadingEvents ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-600">Loading events...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3 flex-wrap justify-center sm:justify-between">
                <EventFilter filter={filter} setFilter={setFilter} />
                <button
                  onClick={() => {
                    const status =
                      filter === "all" ||
                      filter === "liked" ||
                      filter === "friends"
                        ? "planned"
                        : filter;
                    handleAddEvent(
                      status as "planned" | "upcoming" | "happened" | "private"
                    );
                  }}
                  className="px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl text-lg sm:text-base font-bold transition-all duration-300 transform hover:scale-110 active:scale-95 whitespace-nowrap flex items-center gap-2 border-2 border-dashed border-purple-400 bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-white hover:from-purple-500/50 hover:to-pink-500/50 hover:border-purple-300 backdrop-blur-sm shadow-lg shadow-purple-500/20"
                  style={{
                    backgroundColor: "#060010",
                  }}
                  title="Add New Event"
                >
                  <span className="text-2xl sm:text-xl flex-shrink-0">+</span>
                  <span>Add Event</span>
                </button>
              </div>
              <TodoList
                isAuthenticated={isAuthenticated}
                todos={events}
                setTodos={setEvents}
                search={searchType === "events" ? search : ""}
                filter={filter}
                token={token}
                profileOwnerName={
                  profile?.name || profile?.email || "This user"
                }
              />
            </>
          )}
        </main>
        <footer
          className="
          w-full
          py-4
          text-center text-sm
          z-50
          mt-auto
        "
        >
          <p className="flex items-center justify-center gap-1">
            Created with <span className="text-pink-500 animate-pulse">♥</span>{" "}
            by{" "}
            <a
              href="https://github.com/Clorostica"
              target="_blank"
              rel="noopener noreferrer"
              className="
              font-semibold
              text-pink-500
              no-underline
              visited:text-pink-500
              transition
              hover:text-pink-400
              hover:drop-shadow-[0_0_8px_#ec4899]
               "
            >
              Clorostica
            </a>
          </p>
        </footer>
      </div>

      {/* Username Modal */}
      <UsernameModal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        onSubmit={handleUsernameSubmit}
        isLoading={isUpdatingUsername}
        canClose={!isNewlyCreatedUser}
        onCancel={handleCancelUserCreation}
        isNewlyCreatedUser={isNewlyCreatedUser}
      />
    </div>
  );
}
