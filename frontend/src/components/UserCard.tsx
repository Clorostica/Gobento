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
      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:shadow-sm cursor-pointer group"
    >
      {user.picture ? (
        <img
          src={user.picture}
          alt={displayName}
          className="w-12 h-12 rounded-full object-cover ring-2 ring-white"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg ring-2 ring-white">
          {initials}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
          {displayName}
        </p>
        {(user.username || user.name) && (
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        )}
      </div>
    </div>
  );
}
