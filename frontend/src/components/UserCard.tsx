interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export default function UserCard({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:shadow-sm cursor-pointer group">
      {user.picture ? (
        <img
          src={user.picture}
          alt={user.name || user.email}
          className="w-12 h-12 rounded-full object-cover ring-2 ring-white"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg ring-2 ring-white">
          {user.email.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
          {user.name || user.email}
        </p>
        {user.name && (
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        )}
      </div>
    </div>
  );
}
