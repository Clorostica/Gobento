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
      <div className="mb-3">
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

  return (
    <div className="mb-3">
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
        {displayText}
      </h2>
    </div>
  );
};

export default TaskHeader;
