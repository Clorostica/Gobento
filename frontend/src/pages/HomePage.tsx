import React, { useEffect, useLayoutEffect, useState, useCallback, useMemo, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { getEvents, saveEvents } from "../utils/storage";
import type { Event } from "../types/tasks/task.types";
import Header from "../components/Header";
import TodoList from "../components/TodoList";
import Search from "../components/Search";
import EventFilter from "../components/TaskFilter";
import FloatingActions from "../components/FloatingActions";
import Tooltip from "../components/Tooltip";
import StarBorder from "../components/StarBorder";
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

  const defaultFilter = (location.state as any)?.filter || "all";

  const [search, setSearch] = useState<string>("");
  const [filter, setFilter] = useState<
    | "all"
    | "planned"
    | "upcoming"
    | "happened"
    | "private"
    | "liked"
    | "friends"
  >(defaultFilter);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [cachedUsername] = useState<string | null>(() => localStorage.getItem('gobento_username'));
  const [profile, setProfile] = useState<Profile | null>(null);
  const [searchUsers, setSearchUsers] = useState<Profile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isNewlyCreatedUser, setIsNewlyCreatedUser] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const eventsService = useMemo(
    () => new EventsService(apiClient),
    [apiClient]
  );
  const usersService = useMemo(() => new UsersService(apiClient), [apiClient]);

  const createUser = useCallback(async () => {
    if (!token) return;

    try {
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

        setIsNewlyCreatedUser(false);
        return;
      }
    } catch (error) {}

    try {
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

        setIsNewlyCreatedUser(true);
        setShowUsernameModal(true);
      }
    } catch (error) {
      console.error("❌ Error creating user:", error);

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
      if (isAuthenticated && token) {
        const events = await eventsService.getAllEvents();
        setEvents(events);
      } else if (!isAuthenticated && !isLoading) {
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

  useEffect(() => {
    if ((location.state as any)?.filter === "friends") {
      setFilter("friends");

      loadEvents();

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

  // Keep --header-h CSS variable in sync with real header height.
  // Must re-run after isLoading resolves, because the real <header> isn't
  // in the DOM while the loading spinner is shown.
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) {
        document.documentElement.style.setProperty("--header-h", `${h}px`);
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoading]);

  useEffect(() => {
    if (!token || !search.trim()) {
      setSearchUsers([]);
      setIsSearchingUsers(false);
      return;
    }

    const searchUsersDebounced = async () => {
      setIsSearchingUsers(true);
      try {
        const response = await fetch(
          `${env.API_URL}/users/search?q=${encodeURIComponent(search.trim())}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          const users = (data.users || [])
            .filter((u: any) => u.id !== user?.sub && u.username)
            .map((u: any) => ({
              id: u.id,
              username: u.username as string,
              avatarUrl: u.avatar_url || u.avatarUrl || null,
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

    const timeoutId = setTimeout(searchUsersDebounced, 300);
    return () => clearTimeout(timeoutId);
  }, [search, token, user?.sub]);

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
        if (userData.username) {
          localStorage.setItem('gobento_username', userData.username);
        }

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
          if (updatedUser.username) {
            localStorage.setItem('gobento_username', updatedUser.username);
          }
          setShowUsernameModal(false);
          setIsNewlyCreatedUser(false);
        }
      } catch (error: unknown) {
        console.error("❌ Error updating username:", error);

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

      logout({ logoutParams: { returnTo: window.location.origin } });
    } catch (error) {
      console.error("❌ Error deleting user:", error);

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
      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/80 border-b border-white/10 shadow-md">

          {/* ── Nav row ─────────────────────────────────────────────────── */}
          <div className="flex items-center w-full px-3 sm:px-5 lg:px-8 xl:px-12 py-2.5 sm:py-3">

            {/* Brand — more prominent, breathing room via margin */}
            <Link to="/feed" className="no-underline flex items-center gap-1.5 sm:gap-2 flex-shrink-0 group mr-4 sm:mr-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 group-hover:text-purple-300 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="text-white font-extrabold text-lg sm:text-xl tracking-tight group-hover:opacity-80 transition-opacity">Gobento</span>
            </Link>

            {/* Divider — visible at all sizes, separates brand from nav */}
            <div className="h-5 w-px flex-shrink-0 mr-4 sm:mr-5" style={{ background: "rgba(255,255,255,0.15)" }} />

            {/* Nav buttons */}
            {isAuthenticated && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Tooltip label="My Events" position="bottom">
                  <StarBorder onClick={() => navigate("/")} className="flex items-center justify-center px-2.5 py-2 min-h-[36px] star-border-container cursor-pointer" color="#FB923C" speed="6s" thickness={2}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </StarBorder>
                </Tooltip>
                <Tooltip label="Home" position="bottom">
                  <StarBorder onClick={() => navigate("/feed")} className="flex items-center justify-center px-2.5 py-2 min-h-[36px] star-border-container cursor-pointer" color="#B19EEF" speed="6s" thickness={2}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  </StarBorder>
                </Tooltip>
              </div>
            )}

            {/* Search — inline on md+, hidden here on smaller screens */}
            <div className="hidden md:block flex-1 min-w-0 mx-3">
              <Search search={search} setSearch={setSearch} />
            </div>

            {/* Spacer — only on small screens where search is below */}
            <div className="flex-1 md:hidden" />

            {/* User actions */}
            <div className="flex-shrink-0 mr-0.5 md:mr-0">
              <Header token={token} API_URL={env.API_URL} initialDisplayName={cachedUsername || profile?.username || null} onEditProfile={() => setShowUsernameModal(true)} />
            </div>

          </div>

          {/* ── Search row — only on screens narrower than md ────────── */}
          <div className="md:hidden px-4 pb-2.5">
            <Search search={search} setSearch={setSearch} className="relative w-full min-w-0" />
          </div>

        </header>
        {/* Spacer — CSS var --header-h defaults to 72px, updated to exact height by ResizeObserver */}
        <div aria-hidden="true" style={{ height: "var(--header-h, 120px)", flexShrink: 0 }} />
        <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 pt-8 sm:pt-6 pb-8 flex-grow">
          {isLoadingEvents ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-600">Loading events...</p>
              </div>
            </div>
          ) : (
            <>
              {/* People results — shown when search matches users */}
              {search.trim() && (searchUsers.length > 0 || isSearchingUsers) && (
                <div className="w-full mb-6 px-4">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(167,139,250,0.7)" }}>People</p>
                  {isSearchingUsers ? (
                    <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                      <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                      <span className="text-sm">Searching…</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {searchUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => navigate(`/user/${u.id}`)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-150"
                          style={{
                            background: "rgba(139,92,246,0.08)",
                            border: "1px solid rgba(139,92,246,0.2)",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(139,92,246,0.16)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(139,92,246,0.08)")}
                        >
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.username || ""} className="w-7 h-7 rounded-full object-cover ring-1 ring-purple-500/30 flex-shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {(u.username || "?").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>@{u.username}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Category filters + Add Event */}
              <div className="w-full mb-10 px-4">
                {/* Filter pills */}
                <div
                  className="flex items-stretch gap-1 p-1.5 rounded-2xl overflow-x-auto scrollbar-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <EventFilter filter={filter} setFilter={setFilter} />

                  {/* Divider + Add Event — inline on sm+ only */}
                  <div className="hidden md:block w-px self-stretch mx-1 flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <button
                    onClick={() => {
                      const status =
                        filter === "all" || filter === "liked" || filter === "friends"
                          ? "planned"
                          : filter;
                      handleAddEvent(status as "planned" | "upcoming" | "happened" | "private");
                    }}
                    className="hidden md:flex flex-shrink-0 items-center gap-1.5 py-2 px-4 rounded-xl text-sm font-bold text-purple-300 hover:text-white transition-all duration-200 hover:bg-purple-500/20 active:scale-95"
                    style={{ border: "2px dashed rgba(168,85,247,0.5)" }}
                  >
                    <span className="text-base leading-none font-light">+</span>
                    <span className="whitespace-nowrap">Add Event</span>
                  </button>
                </div>

                {/* Add Event — full-width row below pills on mobile/sm */}
                <button
                  onClick={() => {
                    const status =
                      filter === "all" || filter === "liked" || filter === "friends"
                        ? "planned"
                        : filter;
                    handleAddEvent(status as "planned" | "upcoming" | "happened" | "private");
                  }}
                  className="md:hidden w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-purple-300 hover:text-white transition-all duration-200 hover:bg-purple-500/20 active:scale-95"
                  style={{
                    border: "2px dashed rgba(168,85,247,0.5)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <span className="text-base leading-none font-light">+</span>
                  <span>Add Event</span>
                </button>
              </div>

              <FloatingActions
                onAddEvent={() => {
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
              />
              <TodoList
                isAuthenticated={isAuthenticated}
                todos={events}
                setTodos={setEvents}
                search={search}
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
