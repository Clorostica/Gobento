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
  const { user, isAuthenticated } = useAuth0<AuthUser>();
  const apiClient = useApiClient();
  const [isFollowersFollowingPanelOpen, setIsFollowersFollowingPanelOpen] =
    useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const loadUsername = async () => {
      if (!isAuthenticated || !token || userId) {
        setUsername(null);
        return;
      }

      try {
        apiClient.setToken(token);
        const usersService = new UsersService(apiClient);
        const userData = await usersService.getCurrentUser();
        setUsername(userData.username || null);
      } catch (error: unknown) {
        if (
          error &&
          typeof error === "object" &&
          "status" in error &&
          error.status === 401
        ) {
          setUsername(null);
          return;
        }
        if (error instanceof Error && !error.message.includes("401")) {
          console.error("Error loading username:", error);
        }
        setUsername(null);
      }
    };

    if (isAuthenticated && token) {
      loadUsername();
    } else {
      setUsername(null);
    }
  }, [isAuthenticated, token, userId, apiClient]);

  const displayName = username || user?.name || user?.email || "";
  const avatarLetter = (displayName || "U").charAt(0).toUpperCase();

  return (
    <>
      <div className="flex justify-between sm:justify-end items-center w-full gap-2 sm:gap-2 md:gap-3">
        <div className="flex items-center gap-2 md:gap-3 ml-auto sm:ml-0">
          {isAuthenticated ? (
            <>
              {showConnections && (
                <StarBorder
                  onClick={() => setIsFollowersFollowingPanelOpen(true)}
                  className="star-border-container font-semibold shadow-lg transition-colors duration-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base px-2 sm:px-3 py-1.5 sm:py-2"
                  color="#B19EEF"
                  speed="6s"
                  thickness={2}
                  title="View connections"
                >
                  <span className="block sm:hidden text-base">👥</span>
                  <span className="hidden sm:flex items-center gap-1.5">
                    <span>👥</span>
                    <span>Connections</span>
                  </span>
                </StarBorder>
              )}

              <StarBorder
                className="star-border-container font-semibold shadow-lg transition-colors duration-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base px-2 sm:px-3 py-1.5 sm:py-2"
                color="#B19EEF"
                speed="6s"
                thickness={2}
                title={displayName || "User profile"}
              >
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={displayName || "User"}
                    className="rounded-full w-6 h-6 sm:w-7 sm:h-7 ring-2 ring-purple-500/50 flex-shrink-0"
                  />
                ) : (
                  <div className="rounded-full w-6 h-6 sm:w-7 sm:h-7 ring-2 ring-purple-500/50 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {avatarLetter}
                  </div>
                )}

                {displayName && (
                  <span className="hidden sm:block text-white font-medium text-xs sm:text-sm md:text-base truncate max-w-[80px] md:max-w-[120px] lg:max-w-[150px]">
                    {displayName}
                  </span>
                )}
              </StarBorder>

              <Logout />
            </>
          ) : (
            <Login />
          )}
        </div>
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
