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
  showConnections?: boolean;
}

const Header = ({
  token,
  API_URL,
  userId,
  showConnections = true,
}: HeaderProps) => {
  const { user, isAuthenticated, logout } = useAuth0<AuthUser>();
  const apiClient = useApiClient();
  const [isFollowersFollowingPanelOpen, setIsFollowersFollowingPanelOpen] =
    useState(false);
  const [username, setUsername] = useState<string | null>(null);

  // Determinar el texto del botón según si es tu perfil o de otro usuario
  const buttonText = userId ? "👥 Connections" : "👥 Followers & Following";
  const buttonTextMobile = userId ? "👥" : "👥";

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
      <div className="flex justify-end items-center gap-4 flex-wrap">
        {isAuthenticated ? (
          <>
            {showConnections && (
              <StarBorder
                onClick={() => setIsFollowersFollowingPanelOpen(true)}
                className="font-semibold shadow-lg transition-colors duration-300 flex items-center gap-1 sm:gap-1.5 md:gap-2 text-xs sm:text-sm md:text-base px-2 sm:px-3 py-1.5 sm:py-2"
                color="#B19EEF"
                speed="6s"
                thickness={2}
                title={
                  userId
                    ? "View this user's connections"
                    : "View your followers and following"
                }
              >
                <span className="hidden sm:inline">{buttonText}</span>
                <span className="sm:hidden">{buttonTextMobile}</span>
              </StarBorder>
            )}
            {/* Desktop: Full logout button */}
            <div className="hidden sm:block">
              <Logout />
            </div>
            {/* Mobile: Icon-only logout button */}
            <button
              onClick={() =>
                logout({ logoutParams: { returnTo: window.location.origin } })
              }
              className="sm:hidden p-1.5 text-white hover:text-purple-300 transition-colors rounded"
              title="Sign Out"
              type="button"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
            {user && (
              <div className="flex items-center gap-4">
                {(user.picture || username || user.name) && (
                  <>
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={username || user.name || user.email || "User"}
                        className="rounded-full w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 ring-2 ring-purple-500 flex-shrink-0"
                      />
                    ) : (
                      <div className="rounded-full w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 ring-2 ring-purple-500 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm md:text-base flex-shrink-0">
                        {(username || user.name || user.email || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    {(username || user.name || user.email) && (
                      <span className="hidden md:block text-white font-medium text-sm md:text-base truncate max-w-[120px] lg:max-w-none">
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
