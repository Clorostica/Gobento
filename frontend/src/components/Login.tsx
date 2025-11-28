import { useAuth0 } from "@auth0/auth0-react";

const Login = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <button
      onClick={() => loginWithRedirect()}
      className="px-5 py-3 sm:px-6 sm:py-3 rounded-full font-semibold shadow-lg transition-colors duration-300 bg-white text-purple-600 hover:bg-purple-100 flex items-center gap-2 sm:gap-2.5 text-base sm:text-lg"
      title="Sign In"
    >
      <svg
        className="w-5 h-5 sm:w-6 sm:h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
        />
      </svg>
      <span className="hidden sm:inline">Sign In</span>
    </button>
  );
};

export default Login;
