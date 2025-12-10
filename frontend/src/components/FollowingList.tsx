import UserCard from "./UserCard";

interface User {
  id: string;
  email: string;
  name?: string;
  username?: string | null;
  picture?: string;
}

interface FollowingListProps {
  users: User[];
  isLoading: boolean;
  searchTerm: string;
}

export default function FollowingList({
  users,
  isLoading,
  searchTerm,
}: FollowingListProps) {
  const filtered = users.filter((u) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      u.email.toLowerCase().includes(searchLower) ||
      u.name?.toLowerCase().includes(searchLower) ||
      u.username?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return <p className="text-center py-10">Loading following...</p>;
  }

  if (filtered.length === 0) {
    return (
      <p className="text-center py-10">You are not following anyone yet</p>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      {filtered.map((u) => (
        <UserCard key={u.id} user={u} />
      ))}
    </div>
  );
}
