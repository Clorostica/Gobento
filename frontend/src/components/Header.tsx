import React, { useState } from "react";
import Login from "./Login";
import Logout from "./Logout";
import FollowersFollowingPanel from "./FollowersFollowingPanel";
import { useAuth0 } from "@auth0/auth0-react";
import type { AuthUser } from "../types/auth/user.types";

interface HeaderProps {
  token: string | null;
  API_URL: string;
  userId?: string | undefined;
}

const Header = ({ token, API_URL, userId }: HeaderProps) => {
  const { user, isAuthenticated } = useAuth0<AuthUser>();
  const [isFollowersFollowingPanelOpen, setIsFollowersFollowingPanelOpen] =
    useState(false);

  // Determinar el texto del botón según si es tu perfil o de otro usuario
  const buttonText = userId ? "👥 Connections" : "👥 Followers & Following";

  return (
    <>
      <div className="flex justify-end items-center gap-2 sm:gap-3">
        {isAuthenticated ? (
          <>
            <button
              onClick={() => setIsFollowersFollowingPanelOpen(true)}
              className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              title={
                userId
                  ? "View this user's connections"
                  : "View your followers and following"
              }
            >
              {buttonText}
            </button>
            <Logout />
            {user && user.picture && user.name && (
              <img
                src={user.picture}
                alt={user.name}
                className="rounded-full w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-purple-500"
              />
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
