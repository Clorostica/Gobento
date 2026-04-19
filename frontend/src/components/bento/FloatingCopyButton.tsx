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
      className={`absolute -top-4 -right-6 w-12 h-12 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-[999999] ${
        isCopied
          ? "bg-gradient-to-br from-red-500 to-orange-500"
          : isCopying
          ? "bg-gradient-to-br from-purple-500/90 to-pink-500/90 scale-95 cursor-wait"
          : "bg-gradient-to-br from-purple-500 to-pink-500"
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
      {isCopying ? (
        <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
      ) : isCopied ? (
        /* Filled bookmark — pinned/saved */
        <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
          <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
          {/* X mark overlaid to indicate "remove" */}
          <line x1="9" y1="9" x2="15" y2="15" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="15" y1="9" x2="9" y2="15" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : (
        /* Outline bookmark — not yet pinned */
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </button>
  );
};

export default FloatingCopyButton;
