import React, { useState } from "react";
import Login from "./Login";
import Logout from "./Logout";
import FollowersFollowingPanel from "./FollowersFollowingPanel";
import NotificationBell from "./NotificationBell";
import StarBorder from "./StarBorder";
import Tooltip from "./Tooltip";
import { useAuth0 } from "@auth0/auth0-react";
import type { AuthUser } from "../types/auth/user.types";

interface HeaderProps {
  token: string | null;
  API_URL: string;
  userId?: string | undefined;
  showConnections?: boolean;
  initialDisplayName?: string | null;
}

const buttonBaseClasses =
  "flex items-center gap-1.5 sm:gap-2 font-semibold shadow-lg transition-colors duration-300 text-sm sm:text-base px-3 py-2 min-h-[38px]";

const Header = ({
  token,
  API_URL,
  userId,
  showConnections = true,
  initialDisplayName,
}: HeaderProps) => {
  const { user, isAuthenticated } = useAuth0<AuthUser>();
  const [isFollowersFollowingPanelOpen, setIsFollowersFollowingPanelOpen] =
    useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // When authenticated, only use the username passed from parent (never Auth0's display name)
  // This prevents the "Claudia Saez" → "claudia" flash caused by Auth0 name vs DB username
  const displayName = isAuthenticated
    ? (initialDisplayName || "")
    : (user?.name || user?.email || "");
  const avatarLetter = (initialDisplayName || user?.name || "U").charAt(0).toUpperCase();

  return (
    <>
      {/* Botones - Siempre alineados a la derecha */}
      <div className="flex items-center gap-2 ml-auto">
        {isAuthenticated ? (
          <>
            {/* Connections Button */}
            {showConnections && (
              <Tooltip label="Friends & connections">
                <StarBorder
                  onClick={() => setIsFollowersFollowingPanelOpen(true)}
                  className={`${buttonBaseClasses} star-border-container`}
                  color="#B19EEF"
                  speed="6s"
                  thickness={2}
                >
                  <span className="block sm:hidden text-base">👥</span>
                  <span className="hidden sm:flex items-center gap-1.5">
                    <span>👥</span>
                    <span>Connections</span>
                  </span>
                </StarBorder>
              </Tooltip>
            )}

            {/* Notification Bell */}
            <NotificationBell token={token} API_URL={API_URL} />

            {/* User Button con dropdown */}
            <div className="relative">
              <Tooltip label={displayName ? `Signed in as @${displayName}` : "Your profile"}>
                <StarBorder
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`${buttonBaseClasses} star-border-container cursor-pointer`}
                  color="#B19EEF"
                  speed="6s"
                  thickness={2}
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
                  <span className="truncate w-[90px] sm:w-[110px] text-left">{displayName}</span>
                )}
              </StarBorder>
              </Tooltip>

              {/* Dropdown menu con Sign Out */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-black/90 backdrop-blur-md rounded-lg shadow-lg z-50 flex flex-col">
                  <Logout />
                </div>
              )}
            </div>
          </>
        ) : (
          <Login className={buttonBaseClasses} />
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
