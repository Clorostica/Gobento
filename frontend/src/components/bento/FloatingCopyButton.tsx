import React from "react";
import type { Task } from "@/types/tasks/task.types";

interface FloatingCopyButtonProps {
  task: Task;
  isCopied: boolean;
  isCopying: boolean;
  onCopyEvent: (task: Task) => void;
}

const FloatingCopyButton: React.FC<FloatingCopyButtonProps> = ({
  task,
  isCopied,
  isCopying,
  onCopyEvent,
}) => {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isCopying) {
          onCopyEvent(task);
        }
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      disabled={isCopying}
      className={`absolute -top-4 -right-6 w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center text-white text-2xl font-bold z-[999999] ${
        isCopied
          ? "bg-gradient-to-br from-red-500 to-orange-500 hover:shadow-red-500/70"
          : isCopying
          ? "bg-gradient-to-br from-purple-500/90 to-pink-500/90 scale-95 cursor-wait"
          : "bg-gradient-to-br from-purple-500 to-pink-500 hover:shadow-purple-500/70"
      }`}
      title={
        isCopied
          ? "Remove from my events"
          : isCopying
          ? "Processing..."
          : "Add to my events"
      }
      type="button"
      style={{
        zIndex: 999999,
        position: "absolute",
        boxShadow: isCopied
          ? "0 8px 32px rgba(239, 68, 68, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.1)"
          : "0 8px 32px rgba(147, 51, 234, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.1)",
      }}
    >
      <span className="transition-all duration-300 leading-none">
        {isCopied ? "-" : isCopying ? "..." : "+"}
      </span>
      {!isCopied && !isCopying && (
        <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
      )}
    </button>
  );
};

export default FloatingCopyButton;
