import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { getEvents } from "../utils/storage";
import type { Event } from "../types/tasks/task.types";
import Header from "../components/Header";
import TodoList from "../components/TodoList";
import Search from "../components/Search";
import EventFilter from "../components/TaskFilter";
import PixelBlast from "../components/PixelBlast";
import {
  requestNotificationPermission,
  checkOverdueEvents,
} from "../utils/notifications";
import { useAuth, useApiClient } from "../hooks";
import { EventsService, UsersService } from "../services";
import { env } from "../config/env";
import "../pixelblast.css";

interface Profile {
  id: string;
  email: string;
  name?: string | null;
  isPrivate: boolean;
}

export default function HomePage() {
  const { user, isAuthenticated } = useAuth0();
  const { token, isLoading } = useAuth();
  const apiClient = useApiClient();

  const [search, setSearch] = useState<string>("");
  const [filter, setFilter] = useState<
    "all" | "planned" | "upcoming" | "happened" | "liked"
  >("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

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
          isPrivate: existingUser.isPrivate ?? false,
        });
        return;
      }
    } catch (error) {
      // User doesn't exist, continue to create
    }

    try {
      // Create new user
      const newUser = await usersService.createUser();
      if (newUser.id) {
        setProfile({
          id: newUser.id,
          email: newUser.email || user?.email || "",
          name: newUser.name ?? user?.name ?? null,
          isPrivate: newUser.isPrivate ?? false,
        });
      }
    } catch (error) {
      console.error("❌ Error creating user:", error);
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

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      createUser();
    }
  }, [isAuthenticated, isLoading, user, createUser]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

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
          isPrivate: userData.isPrivate ?? false,
        });
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
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
          }}
        >
          <PixelBlast
            variant="circle"
            pixelSize={6}
            color="#B19EEF"
            patternScale={3}
            patternDensity={0.8}
            pixelSizeJitter={0.5}
            enableRipples
            rippleSpeed={0.4}
            rippleThickness={0.12}
            rippleIntensityScale={1.5}
            liquid
            liquidStrength={0.12}
            liquidRadius={1.2}
            liquidWobbleSpeed={5}
            speed={0.6}
            edgeFade={0.25}
            transparent={false}
            style={{ width: "100%", height: "100%" }}
          />
        </div>

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
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
        }}
      >
        <PixelBlast
          variant="circle"
          pixelSize={6}
          color="#B19EEF"
          patternScale={3}
          patternDensity={0.8}
          pixelSizeJitter={0.5}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid
          liquidStrength={0.12}
          liquidRadius={1.2}
          liquidWobbleSpeed={5}
          speed={0.6}
          edgeFade={0.25}
          transparent={false}
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </div>

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
        <header className="sticky top-0 z-50 w-full px-6 py-4 backdrop-blur-md bg-black/80 border-b border-gray-700 shadow-md">
          <div className="w-full sm:max-w-7xl sm:mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-5">
            <div className="flex items-center justify-between mb-2 sm:mb-0">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg text-sm sm:text-base">
                  📋
                </div>

                <h1 className="text-white font-bold text-xl">EventSync</h1>
                <div className="ml-4 hidden sm:block w-64">
                  <Search search={search} setSearch={setSearch} />
                </div>
              </div>

              <div className="flex-shrink-0">
                <Header token={token} API_URL={env.API_URL} />
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
          {isLoadingEvents ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-600">Loading events...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <EventFilter filter={filter} setFilter={setFilter} />
              </div>
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
          border-t border-gray-200/50
          backdrop-blur-sm bg-white/20
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
    </div>
  );
}
