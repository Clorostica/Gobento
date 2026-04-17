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
  if (!displayText || displayText.trim() === "") {
    return (
      <div>
        <div
          className={`text-lg font-semibold ${
            !isReadOnly && !task.sharedFromUserId ? "cursor-pointer" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isReadOnly && !task.sharedFromUserId) {
              onEditStart();
            }
          }}
          style={{ fontSize: "1.125rem", fontWeight: 600 }}
        >
          <span className="flex items-center gap-2 italic opacity-70">
            <span className="animate-pulse">✨</span>
            <span>Write your event title</span>
          </span>
        </div>
      </div>
    );
  }

  const sharedAvatar = task.sharedFromUserAvatar || null;
  const sharedInitial = task.sharedFromUsername
    ? task.sharedFromUsername.charAt(0).toUpperCase()
    : "?";

  return (
    <div>
      <h2
        className={`magic-bento-card__title ${
          !isReadOnly && !task.sharedFromUserId
            ? "cursor-pointer hover:opacity-80"
            : ""
        } transition-opacity text-lg font-semibold`}
        onClick={(e) => {
          e.stopPropagation();
          if (!isReadOnly && !task.sharedFromUserId) {
            onEditStart();
          }
        }}
        onKeyDown={!isReadOnly ? onKeyDown : undefined}
        tabIndex={!isReadOnly ? 0 : undefined}
        title={!isReadOnly ? "Click to edit or start typing" : undefined}
        style={{
          fontSize: "1.125rem",
          fontWeight: 600,
          wordWrap: "break-word",
          overflowWrap: "break-word",
          whiteSpace: "normal",
        }}
      >
        <span className="inline-flex items-center gap-2 flex-wrap">
          <span>{displayText}</span>
          {!!task.sharedFromUserId && (
            <span
              className="inline-flex items-center gap-1 flex-shrink-0"
              title={task.sharedFromUsername ? `From @${task.sharedFromUsername}` : "Shared from a friend"}
            >
              {sharedAvatar ? (
                <img
                  src={sharedAvatar}
                  alt={task.sharedFromUsername || ""}
                  className="rounded-full object-cover"
                  style={{ width: 20, height: 20, border: "2px solid rgba(168,85,247,0.6)" }}
                />
              ) : (
                <span
                  className="rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{
                    width: 20,
                    height: 20,
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                    color: "white",
                  }}
                >
                  {sharedInitial}
                </span>
              )}
            </span>
          )}
        </span>
      </h2>
    </div>
  );
};

export default TaskHeader;
