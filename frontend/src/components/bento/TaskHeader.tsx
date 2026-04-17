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
      <div className="flex-1 text-lg font-semibold" style={{ fontSize: "1rem", fontWeight: 600 }}>
        <span className="flex items-center gap-2 italic opacity-70">
          <span className="animate-pulse">✨</span>
          <span>Write your event title</span>
        </span>
      </div>
    );
  }

  const displayText =
    task.title || (task.text && !task.title ? task.text : "") || "";
  const isShared = !!task.sharedFromUserId;
  const sharedAvatar = task.sharedFromUserAvatar || null;
  const sharedInitial = task.sharedFromUsername
    ? task.sharedFromUsername.charAt(0).toUpperCase()
    : "?";

  const titleContent = !displayText || displayText.trim() === "" ? (
    <span className="flex items-center gap-2 italic opacity-70" style={{ fontSize: "1.125rem", fontWeight: 600 }}>
      <span className="animate-pulse">✨</span>
      <span>Write your event title</span>
    </span>
  ) : (
    <span style={{ fontSize: "1.125rem", fontWeight: 600, wordWrap: "break-word", overflowWrap: "break-word", whiteSpace: "normal" }}>
      {displayText}
    </span>
  );

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {/* Original creator avatar — only for shared events */}
      {isShared && (
        sharedAvatar ? (
          <img
            src={sharedAvatar}
            alt={task.sharedFromUsername || ""}
            className="rounded-full object-cover flex-shrink-0"
            style={{
              width: 28,
              height: 28,
              border: "2px solid rgba(168,85,247,0.55)",
              boxShadow: "0 0 0 1px rgba(168,85,247,0.2)",
            }}
            title={task.sharedFromUsername ? `@${task.sharedFromUsername}` : "Shared from a friend"}
          />
        ) : (
          <span
            className="rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 select-none"
            style={{
              width: 28,
              height: 28,
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              color: "white",
              border: "2px solid rgba(168,85,247,0.55)",
              boxShadow: "0 0 0 1px rgba(168,85,247,0.2)",
            }}
            title={task.sharedFromUsername ? `@${task.sharedFromUsername}` : "Shared from a friend"}
          >
            {sharedInitial}
          </span>
        )
      )}

      {/* Title */}
      <h2
        className={`magic-bento-card__title min-w-0 ${
          !isReadOnly && !isShared ? "cursor-pointer hover:opacity-80" : ""
        } transition-opacity`}
        onClick={(e) => {
          e.stopPropagation();
          if (!isReadOnly && !isShared) onEditStart();
        }}
        onKeyDown={!isReadOnly ? onKeyDown : undefined}
        tabIndex={!isReadOnly ? 0 : undefined}
        title={!isReadOnly && !isShared ? "Click to edit or start typing" : undefined}
        style={{ fontWeight: 600 }}
      >
        {titleContent}
      </h2>
    </div>
  );
};

export default TaskHeader;
