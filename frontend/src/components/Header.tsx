import { useState } from "react";
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
  onEditProfile?: () => void;
}

const Header = ({
  token,
  API_URL,
  userId,
  showConnections = true,
  initialDisplayName,
  onEditProfile,
}: HeaderProps) => {
  const { user, isAuthenticated } = useAuth0<AuthUser>();
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

            {/* User avatar button — toggles dropdown */}
            <div className="relative">
              <StarBorder
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
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
                {displayName && (
                  <span className="hidden lg:block truncate max-w-[100px] text-sm text-left">{displayName}</span>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white/40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </StarBorder>

              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden z-50 flex flex-col"
                  style={{
                    background: "rgba(5,0,20,0.97)",
                    border: "1px solid rgba(139,92,246,0.25)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
                    backdropFilter: "blur(16px)",
                  }}
                >
                  {onEditProfile && (
                    <button
                      onClick={() => { setIsUserMenuOpen(false); onEditProfile(); }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors text-left"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Edit Profile
                    </button>
                  )}
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
