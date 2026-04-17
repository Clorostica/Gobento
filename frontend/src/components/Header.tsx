import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const Header = ({
  token,
  API_URL,
  userId,
  showConnections = true,
  initialDisplayName,
}: HeaderProps) => {
  const { user, isAuthenticated } = useAuth0<AuthUser>();
  const navigate = useNavigate();
  const [isFollowersFollowingPanelOpen, setIsFollowersFollowingPanelOpen] =
    useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const displayName = isAuthenticated
    ? (initialDisplayName || "")
    : (user?.name || user?.email || "");
  const avatarLetter = (initialDisplayName || user?.name || "U").charAt(0).toUpperCase();

  const iconBtn = "flex items-center justify-center px-2.5 py-2 min-h-[36px] star-border-container cursor-pointer font-semibold shadow-lg transition-colors duration-300";

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {isAuthenticated ? (
          <>
            {/* Notification Bell */}
            <NotificationBell token={token} API_URL={API_URL} />

            {/* Connections — hidden on mobile, shown sm+ */}
            {showConnections && (
              <span className="hidden sm:inline-flex">
                <Tooltip label="Connections">
                  <StarBorder
                    onClick={() => setIsFollowersFollowingPanelOpen(true)}
                    className={iconBtn}
                    color="#B19EEF"
                    speed="6s"
                    thickness={2}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </StarBorder>
                </Tooltip>
              </span>
            )}

            {/* User avatar button — avatar only on mobile, avatar+name on lg+ */}
            <div className="relative">
              <Tooltip label={displayName ? `@${displayName}` : "My events"}>
                <StarBorder
                  onClick={() => navigate("/my-events")}
                  className={`${iconBtn} gap-2`}
                  color="#FB923C"
                  speed="6s"
                  thickness={2}
                >
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={displayName || "User"}
                      className="rounded-full w-6 h-6 ring-2 ring-orange-500/50 flex-shrink-0"
                    />
                  ) : (
                    <div className="rounded-full w-6 h-6 ring-2 ring-orange-500/50 bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {avatarLetter}
                    </div>
                  )}
                  {/* Username only visible on large screens */}
                  {displayName && (
                    <span className="hidden lg:block truncate max-w-[100px] text-sm text-left">{displayName}</span>
                  )}
                </StarBorder>
              </Tooltip>

              {/* Sign-out chevron */}
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors z-10"
                aria-label="Account menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-black/90 backdrop-blur-md rounded-lg shadow-lg z-50 flex flex-col">
                  <Logout />
                </div>
              )}
            </div>
          </>
        ) : (
          <Login className="flex items-center gap-2 font-semibold shadow-lg transition-colors duration-300 text-sm px-3 py-2 min-h-[36px]" />
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
