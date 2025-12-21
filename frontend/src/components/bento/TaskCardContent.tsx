import React, { useState, useRef, useEffect } from "react";
import type { Task } from "@/types/tasks/task.types";
import TaskHeader from "./TaskHeader";
import TaskEditForm from "./TaskEditForm";
import TaskDateDisplay from "./TaskDateDisplay";
import TaskImageViewer from "./TaskImageViewer";
import HeartButton from "./HeartButton";
import FloatingCopyButton from "./FloatingCopyButton";
import TextWithMentions from "./TextWithMentions";
import { getStatusIcon, getStatusLabel, getStatusLabelText } from "./utils";

interface TaskCardContentProps {
  task: Task;
  editingId: string | null;
  editTitle: string;
  editText: string;
  editDueDate: string;
  editStartTime: string;
  editAddress: string;
  editImages: string[];
  onEditStart: (task: Task) => void;
  onEditSave: (taskId: string) => void;
  onEditCancel: () => void;
  onTitleChange: (value: string) => void;
  onTextChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onImagesChange: (images: string[]) => void;
  onEmojiSelect: (emoji: string) => void;
  onDelete?: (id: string) => void;
  onStatusClick: (task: Task) => void;
  onStatusChange?:
    | ((
        id: string,
        status: string | "planned" | "upcoming" | "happened"
      ) => void)
    | undefined;
  onImageClick: (image: string) => void;
  onLikeToggle?: (task: Task) => void;
  onHeaderKeyDown?: (e: React.KeyboardEvent, task: Task) => void;
  isReadOnly?: boolean;
  onCopyEvent?: (task: Task) => void;
  copiedEventIds?: Set<string>;
  copyingEventId?: string | null;
}

const TaskCardContent: React.FC<TaskCardContentProps> = ({
  task,
  editingId,
  editTitle,
  editText,
  editDueDate,
  editStartTime,
  editAddress,
  editImages,
  onEditStart,
  onEditSave,
  onEditCancel,
  onTitleChange,
  onTextChange,
  onDueDateChange,
  onStartTimeChange,
  onAddressChange,
  onImagesChange,
  onEmojiSelect,
  onDelete,
  onStatusClick,
  onStatusChange,
  onImageClick,
  onLikeToggle,
  onHeaderKeyDown,
  isReadOnly = false,
  onCopyEvent,
  copiedEventIds,
  copyingEventId,
}) => {
  const isEditing = editingId === task.id;
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const statuses = ["planned", "upcoming", "happened", "private"];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(event.target as Node)
      ) {
        setShowStatusMenu(false);
      }
    };

    if (showStatusMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showStatusMenu]);

  return (
    <div
      onClick={(e) => {
        if (isEditing || isReadOnly) return; // Prevent editing in read-only mode
        // Prevent editing events shared from other users
        if (task.sharedFromUserId != null) return;

        const target = e.target as HTMLElement;
        const isButton =
          target.closest("button") ||
          target.closest("input") ||
          target.closest("textarea") ||
          target.closest("[role='button']") ||
          target.tagName === "BUTTON" ||
          target.closest(".text-white.hover\\:text-red-300");

        // Check if clicking directly on an image (not just near it)
        const isImage = target.tagName === "IMG";
        const isLink = target.closest("a");
        const isSVG = target.closest("svg") || target.tagName === "svg";

        // Only prevent edit if clicking directly on interactive elements
        // Clicking on the container around images should still allow editing
        if (!isButton && !isImage && !isLink && !isSVG) {
          onEditStart(task);
        }
      }}
      className={`relative ${
        isReadOnly ? "" : "cursor-pointer"
      } overflow-visible`}
    >
      {/* Copy Event Button - Floating top right corner */}
      {onCopyEvent && isReadOnly && (
        <FloatingCopyButton
          task={task}
          isCopied={copiedEventIds?.has(task.id) || false}
          isCopying={copyingEventId === task.id}
          onCopyEvent={onCopyEvent}
        />
      )}

      {/* Top bar with like, status, and delete buttons */}
      {!isEditing && (
        <div className="flex justify-end items-center gap-2 mb-4 relative z-20">
          {onLikeToggle && (
            <HeartButton
              isLiked={task.liked || false}
              onToggle={() => {
                onLikeToggle?.(task);
              }}
              size="md"
            />
          )}
          {!isReadOnly && !task.sharedFromUserId && (
            <div className="relative" ref={statusMenuRef}>
              <span
                className="text-lg opacity-60 hover:opacity-100 transition-opacity"
                title={`${getStatusLabel(
                  task.status
                )} - Click to cycle, click again to see menu`}
                onClick={(e) => {
                  e.stopPropagation();
                  // If menu is open, close it and cycle
                  if (showStatusMenu) {
                    setShowStatusMenu(false);
                    onStatusClick(task);
                  } else {
                    // If menu is closed, show it
                    setShowStatusMenu(true);
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{ cursor: "pointer" }}
              >
                {getStatusIcon(task.status)}
              </span>

              {showStatusMenu && (
                <div className="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-md border border-purple-400/30 rounded-lg shadow-xl z-[100] py-1 min-w-[140px] animate-in fade-in zoom-in duration-200">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-purple-400 uppercase tracking-wider border-b border-purple-400/10 mb-1">
                    Change status
                  </div>
                  {statuses.map((status) => (
                    <button
                      key={status}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onStatusChange) {
                          onStatusChange(task.id, status);
                        } else {
                          // Fallback to cycling if onStatusChange not provided
                          onStatusClick(task);
                        }
                        setShowStatusMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-white/10 transition-colors border-b border-purple-400/10 last:border-b-0 ${
                        task.status === status
                          ? "text-purple-400 font-semibold bg-white/5"
                          : "text-white/70"
                      }`}
                    >
                      <span className="text-lg">{getStatusIcon(status)}</span>
                      <span className="text-xs">
                        {getStatusLabelText(status)}
                      </span>
                      {task.status === status && (
                        <span className="ml-auto text-[10px]">●</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {!isReadOnly && task.sharedFromUserId && (
            <span
              className="text-lg opacity-60"
              title={getStatusLabel(task.status)}
            >
              {getStatusIcon(task.status)}
            </span>
          )}
          {isReadOnly && (
            <span
              className="text-lg opacity-60"
              title={getStatusLabel(task.status)}
            >
              {getStatusIcon(task.status)}
            </span>
          )}
          {onDelete && !isReadOnly && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
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
      )}

      {!isEditing && (
        <TaskHeader
          task={task}
          isEditing={isEditing}
          onEditStart={() => onEditStart(task)}
          onStatusClick={() => onStatusClick(task)}
          {...(onHeaderKeyDown
            ? {
                onKeyDown: (e: React.KeyboardEvent) => onHeaderKeyDown(e, task),
              }
            : {})}
          isReadOnly={isReadOnly}
          onCopyEvent={onCopyEvent ? () => onCopyEvent(task) : undefined}
          isCopied={copiedEventIds?.has(task.id) || false}
          isCopying={copyingEventId === task.id}
          hideActions={true}
        />
      )}

      <div className="magic-bento-card__content">
        {isEditing ? (
          <TaskEditForm
            taskId={task.id}
            title={editTitle}
            text={editText}
            dueDate={editDueDate}
            startTime={editStartTime}
            address={editAddress}
            images={editImages}
            onTitleChange={onTitleChange}
            onTextChange={onTextChange}
            onDueDateChange={onDueDateChange}
            onStartTimeChange={onStartTimeChange}
            onAddressChange={onAddressChange}
            onImagesChange={onImagesChange}
            onEmojiSelect={onEmojiSelect}
            onSave={() => onEditSave(task.id)}
            onCancel={onEditCancel}
            {...(onDelete ? { onDelete } : {})}
          />
        ) : (
          <>
            {task.text && task.text !== task.title && (
              <div className="mb-3">
                <TextWithMentions
                  text={task.text}
                  className={`text-sm text-white leading-relaxed transition-opacity ${
                    !isReadOnly && !task.sharedFromUserId
                      ? "cursor-pointer hover:opacity-80"
                      : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isReadOnly || task.sharedFromUserId) return;
                    onEditStart(task);
                    setTimeout(() => {
                      const descTextarea = document.querySelector(
                        `textarea[data-task-id="${task.id}-description"]`
                      ) as HTMLTextAreaElement;
                      if (descTextarea) {
                        descTextarea.focus();
                        descTextarea.setSelectionRange(
                          descTextarea.value.length,
                          descTextarea.value.length
                        );
                      }
                    }, 100);
                  }}
                />
              </div>
            )}

            <TaskDateDisplay task={task} />

            {task.address && (
              <div className="mb-3">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    task.address
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 text-sm text-white hover:text-purple-300 transition-colors cursor-pointer no-underline"
                >
                  <span className="text-base">📍</span>
                  <span>{task.address}</span>
                  <span className="text-xs opacity-70">→</span>
                </a>
              </div>
            )}

            {(() => {
              // Check for images array first, then fallback to image_url/imageUrl
              const images = task.images || [];
              const imageUrl =
                (task as any).imageUrl || (task as any).image_url;

              // If no images in array but imageUrl exists, use it
              const displayImages =
                images.length > 0 ? images : imageUrl ? [imageUrl] : [];

              return displayImages.length > 0 ? (
                <TaskImageViewer
                  images={displayImages}
                  onImageClick={onImageClick}
                />
              ) : null;
            })()}
          </>
        )}
      </div>
    </div>
  );
};

export default TaskCardContent;
