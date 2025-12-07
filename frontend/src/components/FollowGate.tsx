import React from "react";

interface FollowGateProps {
  isAllowed: boolean; // ¿puede ver el contenido?
  onFollow: () => void;
  children: React.ReactNode;
}

export default function FollowGate({
  isAllowed,
  onFollow,
  children,
}: FollowGateProps) {
  if (isAllowed) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* CONTENIDO DIFUMINADO */}
      <div className="blur-sm pointer-events-none select-none">{children}</div>

      {/* BLOQUEO */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
        <div className="bg-white p-5 rounded-xl shadow-lg text-center space-y-3">
          <p className="font-semibold text-gray-800">
            Follow to unlock events 🔒
          </p>

          <button
            onClick={onFollow}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            Follow
          </button>
        </div>
      </div>
    </div>
  );
}
