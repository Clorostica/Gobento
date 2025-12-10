import React from "react";
import type { Task } from "@/types/tasks/task.types";
import TaskHeader from "./TaskHeader";
import TaskEditForm from "./TaskEditForm";
import TaskDateDisplay from "./TaskDateDisplay";
import TaskImageViewer from "./TaskImageViewer";
import HeartButton from "./HeartButton";
import FloatingCopyButton from "./FloatingCopyButton";
import TextWithMentions from "./TextWithMentions";
import { getStatusIcon, getStatusLabel } from "./utils";

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
  onImageClick,
  onLikeToggle,
  onHeaderKeyDown,
  isReadOnly = false,
  onCopyEvent,
  copiedEventIds,
  copyingEventId,
}) => {
  const isEditing = editingId === task.id;

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
        <div className="flex justify-end items-center gap-2 mb-4 relative z-20 -mr-4">
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
            <span
              className="text-lg opacity-60"
              title={getStatusLabel(task.status)}
              onClick={(e) => {
                e.stopPropagation();
                onStatusClick(task);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ cursor: "pointer" }}
            >
              {getStatusIcon(task.status)}
            </span>
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
