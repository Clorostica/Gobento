import React, { useEffect, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { getEvents } from "./utils/storage";
import type { Event } from "./types/tasks/task.types";
import Header from "./components/Header";
import TodoList from "./components/TodoList";
import Search from "./components/Search";
import EventFilter from "./components/TaskFilter";
import PixelBlast from "./components/PixelBlast";
import {
  requestNotificationPermission,
  checkOverdueEvents,
} from "./utils/notifications";
import "./pixelblast.css";

interface UserResponse {
  email?: string;
}

export default function App() {
  const { user, getIdTokenClaims, isAuthenticated, isLoading } = useAuth0();

  const [search, setSearch] = useState<string>("");
  const [filter, setFilter] = useState<
    "all" | "planned" | "upcoming" | "happened" | "liked"
  >("all");
  const [token, setToken] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  const API_URL = import.meta.env.VITE_API as string;

  const createUser = useCallback(async () => {
    try {
      const tokenClaims = await getIdTokenClaims();
      if (!tokenClaims) return;

      const idToken = tokenClaims.__raw;
      setToken(idToken);

      const checkRes = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (checkRes.ok) {
        try {
          const contentType = checkRes.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const existingUsers: UserResponse = await checkRes.json();
            if (existingUsers.email) return;
          }
        } catch (parseError) {
          console.error("Error parsing user response:", parseError);
        }
      }

      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (res.ok) {
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            await res.json();
          }
        } catch (parseError) {
          console.error("Error parsing create user response:", parseError);
        }
      } else {
        const errorText = await res.text();
        console.error(
          "Error creating user:",
          res.status,
          errorText.substring(0, 200)
        );
      }
    } catch (err) {
      console.error("❌ Error creating/verifying user:", err);
    }
  }, [getIdTokenClaims, API_URL]);

  const loadEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      if (isAuthenticated && user) {
        const tokenClaims = await getIdTokenClaims();
        if (tokenClaims) {
          const idToken = tokenClaims.__raw;
          setToken(idToken);

          const res = await fetch(`${API_URL}/events`, {
            headers: { Authorization: `Bearer ${idToken}` },
          });

          if (!res.ok) {
            const errorText = await res.text();
            console.error("Error loading events:", errorText.substring(0, 200));
            throw new Error(`Error loading events: ${res.status}`);
          }

          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const errorText = await res.text();
            console.error(
              "Unexpected response type:",
              errorText.substring(0, 200)
            );
            throw new Error("Server returned non-JSON response");
          }

          const data = await res.json();
          const events = data.events.map((event: Event) =>
            Object.fromEntries(
              Object.entries(event).map(([key, value]) => [
                key.replace(/_([a-z])/g, (_, letter: string) =>
                  letter.toUpperCase()
                ),
                value,
              ])
            )
          );

          setEvents(events);
        }
      } else if (!isLoading) {
        setToken(null);
        const localEvents = getEvents();
        setEvents(localEvents);
      }
    } catch (err) {
      console.error("❌ Error loading events:", err);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [isAuthenticated, isLoading, user, getIdTokenClaims, API_URL]);

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
                <Header token={token} API_URL={API_URL} />
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
