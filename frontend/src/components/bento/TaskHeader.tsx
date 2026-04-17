import React from "react";
import type { Task } from "@/types/tasks/task.types";
import { getStatusIcon, getStatusLabel } from "./utils";
import HeartButton from "./HeartButton";

interface TaskHeaderProps {
  task: Task;
  isEditing: boolean;
  onEditStart: () => void;
  onDelete?: (id: string) => void;
  onStatusClick: () => void;
  onLikeToggle?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  isReadOnly?: boolean;
  onCopyEvent?: (() => void) | undefined;
  isCopied?: boolean;
  isCopying?: boolean;
  hideActions?: boolean;
}

const TaskHeader: React.FC<TaskHeaderProps> = ({
  task,
  isEditing,
  onEditStart,
  onDelete,
  onStatusClick,
  onLikeToggle,
  onKeyDown,
  isReadOnly = false,
  onCopyEvent,
  isCopied = false,
  isCopying = false,
  hideActions = false,
}) => {
  if (isEditing) {
    return (
      <div
        className="flex-1 text-lg font-semibold"
        style={{ fontSize: "1rem", fontWeight: 600 }}
      >
        <span className="flex items-center gap-2 italic opacity-70">
          <span className="animate-pulse">✨</span>
          <span>Write your event title</span>
        </span>
      </div>
    );
  }

  const displayText =
    task.title || (task.text && !task.title ? task.text : "") || "";

  const sharedAvatar = task.sharedFromUserAvatar || null;
  const sharedUsername = task.sharedFromUsername || null;
  const sharedInitial = sharedUsername
    ? sharedUsername.charAt(0).toUpperCase()
    : "?";
  const isShared = !!task.sharedFromUserId;

  const titleNode = (
    <div className="flex flex-col gap-0.5">
      {/* Author row — only for shared events */}
      {isShared && (
        <div className="flex items-center gap-1.5 mb-0.5">
          {sharedAvatar ? (
            <img
              src={sharedAvatar}
              alt={sharedUsername || ""}
              className="rounded-full object-cover flex-shrink-0"
              style={{ width: 18, height: 18, border: "1.5px solid rgba(168,85,247,0.55)" }}
            />
          ) : (
            <span
              className="rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
              style={{
                width: 18,
                height: 18,
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                color: "white",
                border: "1.5px solid rgba(168,85,247,0.55)",
              }}
            >
              {sharedInitial}
            </span>
          )}
          <span
            className="text-[11px] font-medium truncate"
            style={{ color: "rgba(168,85,247,0.85)" }}
          >
            {sharedUsername ? `@${sharedUsername}` : "friend"}
          </span>
          {/* small share icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ width: 9, height: 9, color: "rgba(168,85,247,0.6)", flexShrink: 0 }}
          >
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
          </svg>
        </div>
      )}

      {/* Title */}
      {!displayText || displayText.trim() === "" ? (
        <span className="flex items-center gap-2 italic opacity-70" style={{ fontSize: "1.125rem", fontWeight: 600 }}>
          <span className="animate-pulse">✨</span>
          <span>Write your event title</span>
        </span>
      ) : (
        <span style={{ fontSize: "1.125rem", fontWeight: 600, wordWrap: "break-word", overflowWrap: "break-word", whiteSpace: "normal" }}>
          {displayText}
        </span>
      )}
    </div>
  );

  return (
    <div>
      <h2
        className={`magic-bento-card__title ${
          !isReadOnly && !isShared ? "cursor-pointer hover:opacity-80" : ""
        } transition-opacity text-lg font-semibold`}
        onClick={(e) => {
          e.stopPropagation();
          if (!isReadOnly && !isShared) onEditStart();
        }}
        onKeyDown={!isReadOnly ? onKeyDown : undefined}
        tabIndex={!isReadOnly ? 0 : undefined}
        title={!isReadOnly && !isShared ? "Click to edit or start typing" : undefined}
        style={{ fontWeight: 600 }}
      >
        {titleNode}
      </h2>
    </div>
  );
};

export default TaskHeader;
