import React, {
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
import StarBorder from "../components/StarBorder";
import Tooltip from "../components/Tooltip";
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
  const [cachedUsername] = useState<string | null>(() =>
    localStorage.getItem("gobento_username"),
  );
  const [profile, setProfile] = useState<Profile | null>(null);
  const [searchUsers, setSearchUsers] = useState<Profile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isNewlyCreatedUser, setIsNewlyCreatedUser] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const eventsService = useMemo(
    () => new EventsService(apiClient),
    [apiClient],
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

  // Keep --header-h CSS variable in sync with real header height
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => {
      if (el.offsetHeight > 0) {
        document.documentElement.style.setProperty(
          "--header-h",
          `${el.offsetHeight}px`,
        );
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (searchType !== "users" || !token) {
      setSearchUsers([]);
      setIsSearchingUsers(false);
      return;
    }

    const searchUsersDebounced = async () => {
      setIsSearchingUsers(true);
      try {
        const queryParam = search.trim()
          ? `?q=${encodeURIComponent(search.trim())}`
          : "?q=";
        const response = await fetch(
          `${env.API_URL}/users/search${queryParam}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
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

    const timeoutId = setTimeout(searchUsersDebounced, search.trim() ? 300 : 0);
    return () => clearTimeout(timeoutId);
  }, [search, searchType, token, env.API_URL, user?.sub]);

  useEffect(() => {
    if (events.length === 0) return;

    checkOverdueEvents(events);

    const interval = setInterval(
      () => {
        checkOverdueEvents(events);
      },
      60 * 60 * 1000,
    );

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
          localStorage.setItem("gobento_username", userData.username);
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
          avatarUrl,
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
              : null,
          );
          if (updatedUser.username) {
            localStorage.setItem("gobento_username", updatedUser.username);
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
    [token, usersService],
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
    [isAuthenticated, token, eventsService],
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
        <header
          ref={headerRef}
          className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/80 border-b border-white/10 shadow-md"
        >
          <div className="flex items-center w-full px-3 sm:px-5 lg:px-6 py-2.5">
            {/* Logo */}
            <Link to="/" className="no-underline flex items-center gap-2 flex-shrink-0 group mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="text-white font-extrabold text-base sm:text-lg tracking-tight group-hover:opacity-80 transition-opacity">Gobento</span>
            </Link>

            <div className="h-5 w-px flex-shrink-0 mr-3" style={{ background: "rgba(255,255,255,0.12)" }} />

            {/* Nav shortcuts — hidden on mobile where sidebar/filter bar handles nav */}
            <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0 mr-3">
              <Tooltip label="My Events" position="bottom">
                <StarBorder
                  onClick={() => {}}
                  className="flex items-center justify-center px-2.5 py-2 min-h-[36px] star-border-container cursor-default"
                  color="#B19EEF"
                  speed="6s"
                  thickness={2}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </StarBorder>
              </Tooltip>
              <Tooltip label="Feed" position="bottom">
                <StarBorder
                  onClick={() => navigate("/feed")}
                  className="flex items-center justify-center px-2.5 py-2 min-h-[36px] star-border-container cursor-pointer"
                  color="#FB923C"
                  speed="6s"
                  thickness={2}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </StarBorder>
              </Tooltip>
            </div>

            {/* Search — expands to fill center */}
            <div className="flex-1 min-w-0 hidden sm:block">
              <Search search={search} setSearch={setSearch} />
            </div>
            <div className="flex-1 sm:hidden" />

            {/* Right side: nav + user */}
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
              <Header
                token={token}
                API_URL={env.API_URL}
                initialDisplayName={profile?.username || cachedUsername || null}
                avatarUrl={profile?.avatarUrl || null}
                onEditProfile={() => setShowUsernameModal(true)}
              />
            </div>
          </div>
          {/* Search — mobile only second row */}
          <div className="sm:hidden px-3 pb-2.5">
            <Search search={search} setSearch={setSearch} />
          </div>
        </header>
        {/* Spacer — 110px fallback covers mobile 2-row header; ResizeObserver updates --header-h to exact value */}
        <div
          aria-hidden="true"
          style={{ height: "var(--header-h, 110px)", flexShrink: 0 }}
        />

        {/* ── Mobile/tablet sticky filter bar (hidden on lg+) ─────────── */}
        <div
          className="lg:hidden sticky z-40 w-full backdrop-blur-md border-b border-t"
          style={{ top: "var(--header-h, 110px)", background: "rgba(0,0,0,0.85)", borderColor: "rgba(139,92,246,0.15)" }}
        >
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              <EventFilter
                filter={filter}
                setFilter={setFilter}
                onAddEvent={() => {
                  const status = filter === "all" || filter === "liked" || filter === "friends" ? "planned" : filter;
                  handleAddEvent(status as "planned" | "upcoming" | "happened" | "private");
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Body: sidebar (lg+) + content ───────────────────────────── */}
        <div className="flex flex-1 min-h-0">

          {/* Desktop sidebar */}
          <aside
            className="hidden lg:flex flex-col flex-shrink-0 w-52 xl:w-60 border-r sticky overflow-y-auto"
            style={{
              top: "var(--header-h, 110px)",
              height: "calc(100vh - var(--header-h, 110px))",
              background: "rgba(0,0,0,0.4)",
              borderColor: "rgba(139,92,246,0.1)",
            }}
          >
            <div className="flex flex-col gap-0.5 p-3 pt-4 flex-1">
              {(
                [
                  { value: "all",      label: "All Events", icon: "🎉", tooltip: "Show all your events",                  gradient: "linear-gradient(135deg,#7c3aed,#a855f7)", glow: "rgba(139,92,246,0.4)" },
                  { value: "planned",  label: "Ideas",      icon: "💡", tooltip: "Ideas — events you're planning",         gradient: "linear-gradient(135deg,#7e22ce,#c026d3)", glow: "rgba(192,38,211,0.4)" },
                  { value: "upcoming", label: "Upcoming",   icon: "📅", tooltip: "Upcoming — happening soon",             gradient: "linear-gradient(135deg,#1d4ed8,#06b6d4)", glow: "rgba(59,130,246,0.4)" },
                  { value: "happened", label: "Memories",   icon: "✨", tooltip: "Memories — past events",               gradient: "linear-gradient(135deg,#047857,#10b981)", glow: "rgba(16,185,129,0.4)" },
                  { value: "private",  label: "Private",    icon: "🔒", tooltip: "Private — only visible to you",        gradient: "linear-gradient(135deg,#374151,#6b7280)", glow: "rgba(107,114,128,0.4)" },
                  { value: "liked",    label: "Favorites",  icon: "❤️", tooltip: "Favorites — events you liked",          gradient: "linear-gradient(135deg,#be123c,#f43f5e)", glow: "rgba(244,63,94,0.4)" },
                  { value: "friends",  label: "Friends",    icon: "👥", tooltip: "Friends — events from people you follow", gradient: "linear-gradient(135deg,#b45309,#f59e0b)", glow: "rgba(245,158,11,0.4)" },
                ] as const
              ).map((f) => {
                const isActive = filter === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value as typeof filter)}
                    title={f.tooltip}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                      isActive ? "text-white" : "text-white/40 hover:text-white/80 hover:bg-white/[0.05]"
                    }`}
                    style={isActive ? { background: f.gradient, boxShadow: `0 2px 16px ${f.glow}` } : undefined}
                  >
                    <span className="text-base leading-none w-5 text-center flex-shrink-0">{f.icon}</span>
                    <span className="flex-1 truncate">{f.label}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Add event at bottom of sidebar */}
            <div className="p-3 border-t" style={{ borderColor: "rgba(139,92,246,0.1)" }}>
              <button
                onClick={() => {
                  const status = filter === "all" || filter === "liked" || filter === "friends" ? "planned" : filter;
                  handleAddEvent(status as "planned" | "upcoming" | "happened" | "private");
                }}
                className="flex items-center justify-center gap-2 w-full px-3 py-3 rounded-xl text-sm font-bold transition-all text-white active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                  boxShadow: "0 4px 20px rgba(139,92,246,0.45)",
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 28px rgba(139,92,246,0.65)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(139,92,246,0.45)")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Event
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 pb-8 px-2 sm:px-4 lg:px-5">
            {isLoadingEvents ? (
              <div className="flex items-center justify-center py-24">
                <div className="text-center space-y-4">
                  <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto" />
                  <p className="text-white/40 text-sm">Loading events…</p>
                </div>
              </div>
            ) : (
              <>
                {/* FAB — only on mobile/tablet where sidebar is hidden */}
                <div className="lg:hidden">
                  <FloatingActions
                    onAddEvent={() => {
                      const status = filter === "all" || filter === "liked" || filter === "friends" ? "planned" : filter;
                      handleAddEvent(status as "planned" | "upcoming" | "happened" | "private");
                    }}
                  />
                </div>
                <TodoList
                  isAuthenticated={isAuthenticated}
                  todos={events}
                  setTodos={setEvents}
                  search={search}
                  filter={filter}
                  token={token}
                  profileOwnerName={profile?.name || profile?.email || "This user"}
                />
              </>
            )}
          </main>
        </div>
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
