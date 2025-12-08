import React, { useState, useEffect } from "react";
import Login from "./Login";
import Logout from "./Logout";
import FollowersFollowingPanel from "./FollowersFollowingPanel";
import StarBorder from "./StarBorder";
import { useAuth0 } from "@auth0/auth0-react";
import type { AuthUser } from "../types/auth/user.types";
import { useApiClient } from "../hooks";
import { UsersService } from "../services";

interface HeaderProps {
  token: string | null;
  API_URL: string;
  userId?: string | undefined;
}

const Header = ({ token, API_URL, userId }: HeaderProps) => {
  const { user, isAuthenticated } = useAuth0<AuthUser>();
  const apiClient = useApiClient();
  const [isFollowersFollowingPanelOpen, setIsFollowersFollowingPanelOpen] =
    useState(false);
  const [username, setUsername] = useState<string | null>(null);

  // Determinar el texto del botón según si es tu perfil o de otro usuario
  const buttonText = userId ? "👥 Connections" : "👥 Followers & Following";

  // Load username from API
  useEffect(() => {
    const loadUsername = async () => {
      if (!isAuthenticated || !token || userId) {
        setUsername(null);
        return; // Don't load for other users' profiles
      }

      try {
        // Ensure apiClient has the token set
        apiClient.setToken(token);
        const usersService = new UsersService(apiClient);
        const userData = await usersService.getCurrentUser();
        setUsername(userData.username || null);
      } catch (error: unknown) {
        // Silently fail if user is not authenticated yet or token is invalid
        if (
          error &&
          typeof error === "object" &&
          "status" in error &&
          error.status === 401
        ) {
          setUsername(null);
          return;
        }
        // Only log unexpected errors
        if (error instanceof Error && !error.message.includes("401")) {
          console.error("Error loading username:", error);
        }
        setUsername(null);
      }
    };

    if (isAuthenticated && token) {
      loadUsername();
    } else {
      // Reset username if not authenticated
      setUsername(null);
    }
  }, [isAuthenticated, token, userId, apiClient]);

  return (
    <>
      <div className="flex justify-end items-center gap-2 sm:gap-3">
        {isAuthenticated ? (
          <>
            <StarBorder
              onClick={() => setIsFollowersFollowingPanelOpen(true)}
              className="font-semibold shadow-lg transition-colors duration-300 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base"
              color="#B19EEF"
              speed="6s"
              thickness={2}
              title={
                userId
                  ? "View this user's connections"
                  : "View your followers and following"
              }
            >
              <span>{buttonText}</span>
            </StarBorder>
            <Logout />
            {user && (
              <div className="flex items-center gap-2">
                {(user.picture || username || user.name) && (
                  <>
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={username || user.name || user.email || "User"}
                        className="rounded-full w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-purple-500"
                      />
                    ) : (
                      <div className="rounded-full w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-purple-500 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                        {(username || user.name || user.email || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    {(username || user.name || user.email) && (
                      <span className="hidden sm:block text-white font-medium text-sm sm:text-base">
                        {username || user.name || user.email || ""}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <Login />
        )}
      </div>

      {isAuthenticated && (
        <FollowersFollowingPanel
          isOpen={isFollowersFollowingPanelOpen}
          onClose={() => setIsFollowersFollowingPanelOpen(false)}
          token={token}
          API_URL={API_URL}
          userId={userId}
        />
      )}
    </>
  );
};

export default Header;
