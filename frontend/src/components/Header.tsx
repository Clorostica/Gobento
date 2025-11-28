import React from "react";
import Login from "./Login";
import Logout from "./Logout";
import { useAuth0 } from "@auth0/auth0-react";
import type { AuthUser } from "../types/auth/user.types";

const Header = () => {
  const { user, isAuthenticated } = useAuth0<AuthUser>();

  return (
    <div className="flex justify-end items-center gap-2 sm:gap-3">
      {isAuthenticated ? (
        <>
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
  );
};

export default Header;
