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
}

const TaskHeader: React.FC<TaskHeaderProps> = ({
  task,
  isEditing,
  onEditStart,
  onDelete,
  onStatusClick,
  onLikeToggle,
  onKeyDown,
}) => {
  if (isEditing) {
    return (
      <div
        className="flex-1 text-lg font-semibold"
        style={{ fontSize: "1.125rem", fontWeight: 600 }}
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
      <div className="flex justify-between items-start gap-2 mb-3">
        <div
          className="flex-1 text-lg font-semibold cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onEditStart();
          }}
          style={{ fontSize: "1.125rem", fontWeight: 600 }}
        >
          <span className="flex items-center gap-2 italic opacity-70">
            <span className="animate-pulse">✨</span>
            <span>Write your event title</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onLikeToggle && (
            <HeartButton
              isLiked={task.liked || false}
              onToggle={onLikeToggle}
              size="md"
            />
          )}
          <span
            className="text-lg opacity-60"
            title={getStatusLabel(task.status)}
            onClick={(e) => {
              e.stopPropagation();
              onStatusClick();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ cursor: "pointer" }}
          >
            {getStatusIcon(task.status)}
          </span>
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Delete button clicked for task:", task.id);
                onDelete(task.id);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="text-white hover:text-red-300 text-xs px-2 py-1 rounded transition-colors z-10 relative"
              title="Delete"
              type="button"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-start gap-2 mb-3">
      <h2
        className="magic-bento-card__title cursor-pointer hover:opacity-80 transition-opacity text-lg font-semibold flex-1"
        onClick={(e) => {
          e.stopPropagation();
          onEditStart();
        }}
        onKeyDown={onKeyDown}
        tabIndex={0}
        title="Click to edit or start typing"
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
      <div className="flex items-center gap-2">
        {onLikeToggle && (
          <HeartButton
            isLiked={task.liked || false}
            onToggle={onLikeToggle}
            size="md"
          />
        )}
        <span
          className="text-lg opacity-60"
          title={getStatusLabel(task.status)}
          onClick={(e) => {
            e.stopPropagation();
            onStatusClick();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ cursor: "pointer" }}
        >
          {getStatusIcon(task.status)}
        </span>
        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Delete button clicked for task:", task.id);
              onDelete(task.id);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="text-white hover:text-red-300 text-xs px-2 py-1 rounded transition-colors z-10 relative"
            title="Delete"
            type="button"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskHeader;
