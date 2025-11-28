import React, { useEffect, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { getTasks } from "./utils/storage";
import type { Task } from "./types/tasks/task.types";
import Header from "./components/Header";
import TodoList from "./components/TodoList";
import Search from "./components/Search";
import PixelBlast from "./components/PixelBlast";
import "./pixelblast.css";

interface UserResponse {
  email?: string;
}

export default function App() {
  const { user, getIdTokenClaims, isAuthenticated, isLoading } = useAuth0();

  const [search, setSearch] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);
  const [todos, setTodos] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

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

      const existingUsers: UserResponse = await checkRes.json();

      if (existingUsers.email) return;

      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) throw new Error("Error creating user");

      await res.json();
    } catch (err) {
      console.error("❌ Error creating/verifying user:", err);
    }
  }, [getIdTokenClaims, API_URL]);

  const loadTasks = useCallback(async () => {
    setIsLoadingTasks(true);
    try {
      if (isAuthenticated && user) {
        const tokenClaims = await getIdTokenClaims();
        if (tokenClaims) {
          const idToken = tokenClaims.__raw;
          setToken(idToken);

          const res = await fetch(`${API_URL}/tasks`, {
            headers: { Authorization: `Bearer ${idToken}` },
          });

          if (!res.ok) throw new Error("Error loading tasks");

          const data = await res.json();
          const tasks = data.tasks.map((task: Task) =>
            Object.fromEntries(
              Object.entries(task).map(([key, value]) => [
                key.replace(/_([a-z])/g, (_, letter: string) =>
                  letter.toUpperCase()
                ),
                value,
              ])
            )
          );

          setTodos(tasks);
        }
      } else if (!isLoading) {
        setToken(null);
        const localTasks = getTasks();
        setTodos(localTasks);
      }
    } catch (err) {
      console.error("❌ Error loading tasks:", err);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [isAuthenticated, isLoading, user, getIdTokenClaims, API_URL]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      createUser();
    }
  }, [isAuthenticated, isLoading, user, createUser]);

  // Loader con fondo animado
  if (isLoading) {
    return (
      <div
        style={{ position: "fixed", inset: 0, width: "100%", height: "100vh" }}
      >
        {/* Fondo PixelBlast */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
          }}
        >
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
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
        </div>

        {/* Contenido del loader */}
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
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "auto",
          minWidth: "100vw",
          minHeight: "100vh",
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
            width: "100vw",
            height: "100vh",
            minWidth: "100vw",
            minHeight: "100vh",
          }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
        <header className="sticky top-0 z-50 bg-slate-50 border-b border-slate-200 shadow-sm w-full px-6 py-4">
          <div className="w-full sm:max-w-7xl sm:mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-5">
            <div className="flex items-center justify-between mb-2 sm:mb-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg text-sm sm:text-base">
                  📋
                </div>
                <h1 className="text-lg sm:text-2xl font-bold text-black">
                  TaskFlow
                </h1>
              </div>

              <div className="flex-shrink-0">
                <Header />
              </div>
            </div>

            <div className="sm:hidden mt-2">
              <Search search={search} setSearch={setSearch} />
            </div>

            <div className="hidden sm:block sm:absolute sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:mx-4">
              <Search search={search} setSearch={setSearch} />
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ">
          {isLoadingTasks ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-600">Loading tasks...</p>
              </div>
            </div>
          ) : (
            <TodoList
              isAuthenticated={isAuthenticated}
              todos={todos}
              setTodos={setTodos}
              search={search}
              token={token}
            />
          )}
        </main>

        {/* Footer */}
        <footer
          className="
  fixed bottom-0 left-0 w-full
  py-4
  text-center text-sm
  border-t border-gray-200/50
  backdrop-blur-sm bg-white/20
  z-50
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
    </>
  );
}
