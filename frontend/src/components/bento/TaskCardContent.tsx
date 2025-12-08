import React from "react";
import type { Task } from "@/types/tasks/task.types";
import TaskHeader from "./TaskHeader";
import TaskEditForm from "./TaskEditForm";
import TaskDateDisplay from "./TaskDateDisplay";
import TaskImageViewer from "./TaskImageViewer";

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
}) => {
  const isEditing = editingId === task.id;

  return (
    <div
      onClick={(e) => {
        // ✅ FIX DEFINITIVO: si ya se está editando, NO volver a disparar onEditStart
        if (isEditing) return;

        const target = e.target as HTMLElement;
        // Check if the click is on a button, input, textarea, or any interactive element
        const isButton =
          target.closest("button") ||
          target.closest("input") ||
          target.closest("textarea") ||
          target.closest("[role='button']") ||
          target.tagName === "BUTTON" ||
          target.closest(".text-white.hover\\:text-red-300"); // Specific class for delete button
        const isImage = target.closest("img");
        const isLink = target.closest("a");
        const isSVG = target.closest("svg") || target.tagName === "svg";
        const isInteractive =
          target.closest("[onClick]") && target !== e.currentTarget;

        if (!isButton && !isImage && !isLink && !isSVG && !isInteractive) {
          onEditStart(task);
        }
      }}
      className="cursor-pointer"
    >
      {!isEditing && (
        <TaskHeader
          task={task}
          isEditing={isEditing}
          onEditStart={() => onEditStart(task)}
          {...(onDelete ? { onDelete } : {})}
          onStatusClick={() => onStatusClick(task)}
          {...(onLikeToggle
            ? {
                onLikeToggle: () => onLikeToggle(task),
              }
            : {})}
          {...(onHeaderKeyDown
            ? {
                onKeyDown: (e: React.KeyboardEvent) => onHeaderKeyDown(e, task),
              }
            : {})}
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
                <p
                  className="text-sm text-white leading-relaxed cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
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
                >
                  {task.text}
                </p>
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
