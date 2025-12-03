import React, { useState } from "react";
import Login from "./Login";
import Logout from "./Logout";
import FollowersPanel from "./FollowersPanel";
import FollowersFollowingPanel from "./FollowersFollowingPanel";
import { useAuth0 } from "@auth0/auth0-react";
import type { AuthUser } from "../types/auth/user.types";

interface HeaderProps {
  token: string | null;
  API_URL: string;
}

const Header = ({ token, API_URL }: HeaderProps) => {
  const { user, isAuthenticated } = useAuth0<AuthUser>();
  const [isFollowersPanelOpen, setIsFollowersPanelOpen] = useState(false);
  const [isFollowersFollowingPanelOpen, setIsFollowersFollowingPanelOpen] =
    useState(false);

  return (
    <>
      <div className="flex justify-end items-center gap-2 sm:gap-3">
        {isAuthenticated ? (
          <>
            <button
              onClick={() => setIsFollowersFollowingPanelOpen(true)}
              className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              title="Followers & Following"
            >
              👥 Followers
            </button>
            <button
              onClick={() => setIsFollowersPanelOpen(true)}
              className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              title="Followers"
            >
              👥 Following
            </button>
            <Logout />
            {user && user.picture && user.name && (
              <img
                src={user.picture}
                alt={user.name}
                className="rounded-full w-8 h-8 sm:w-10 sm:h-10"
              />
            )}
          </>
        ) : (
          <Login />
        )}
      </div>
      {isAuthenticated && (
        <>
          <FollowersFollowingPanel
            isOpen={isFollowersFollowingPanelOpen}
            onClose={() => setIsFollowersFollowingPanelOpen(false)}
            token={token}
            API_URL={API_URL}
          />
          <FollowersPanel
            isOpen={isFollowersPanelOpen}
            onClose={() => setIsFollowersPanelOpen(false)}
            token={token}
            API_URL={API_URL}
          />
        </>
      )}
    </>
  );
};

export default Header;
