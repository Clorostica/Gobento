import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  email: string;
  name?: string;
  username?: string | null;
  picture?: string;
}

export default function UserCard({ user }: { user: User }) {
  const navigate = useNavigate();
  const displayName = user.username || user.name || user.email;
  const initials = user.username
    ? user.username.charAt(0).toUpperCase()
    : user.name
    ? user.name.charAt(0).toUpperCase()
    : user.email.charAt(0).toUpperCase();

  const handleClick = () => {
    navigate(`/user/${user.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer group transition-all duration-200 border border-transparent hover:border-purple-500/20"
      style={{ background: "rgba(255,255,255,0.04)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(139,92,246,0.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
    >
      {user.picture ? (
        <img
          src={user.picture}
          alt={displayName}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30 flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-base ring-2 ring-purple-500/30 flex-shrink-0">
          {initials}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-white/90 truncate group-hover:text-purple-300 transition-colors text-sm">
          {displayName}
        </p>
        {(user.username || user.name) && (
          <p className="text-xs text-white/35 truncate">{user.email}</p>
        )}
      </div>
    </div>
  );
}
