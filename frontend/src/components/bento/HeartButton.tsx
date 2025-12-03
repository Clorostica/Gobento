import React from "react";

interface HeartButtonProps {
  isLiked: boolean;
  onToggle: () => void;
  size?: "sm" | "md" | "lg";
}

const HeartButton: React.FC<HeartButtonProps> = ({
  isLiked,
  onToggle,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      className={`${sizeClasses[size]} transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center`}
      title={isLiked ? "Unlike" : "Like"}
      type="button"
    >
      <svg
        className={`w-full h-full transition-all duration-200 ${
          isLiked
            ? "text-red-500 fill-red-500"
            : "text-black-500 fill-none hover:text-red-400"
        }`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
        fill={isLiked ? "currentColor" : "none"}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
};

export default HeartButton;
