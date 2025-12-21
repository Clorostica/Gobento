import { useAuth0 } from "@auth0/auth0-react";
import React from "react";
import StarBorder from "./StarBorder";

const Logout = () => {
  const { logout } = useAuth0();

  return (
    <StarBorder
      onClick={() =>
        logout({ logoutParams: { returnTo: window.location.origin } })
      }
      className="font-semibold shadow-lg transition-colors duration-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base px-2 sm:px-3 py-1.5 sm:py-2"
      color="#B19EEF"
      speed="6s"
      thickness={2}
      title="Sign Out"
    >
      <svg
        className="w-4 h-4 sm:w-4 sm:h-4"
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
      <span className="hidden sm:inline">Sign Out</span>
    </StarBorder>
  );
};

export default Logout;
