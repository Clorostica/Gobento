import React, { useEffect, useRef } from "react";
import type { Event } from "@/types/tasks/task.types";
import TaskCardContent from "./TaskCardContent";
import ImageModal from "./ImageModal";
import { getStatusColor, getStatusBorderColor, getStatusShadow } from "./utils";

interface EventDetailModalProps {
  event: Event | null;
  onClose: () => void;
  expandedImage: string | null;
  onImageClick: (url: string) => void;
  onCloseImage: () => void;
  // TaskCardContent props
  editingId: string | null;
  editTitle: string;
  editText: string;
  editDueDate: string;
  editStartTime: string;
  editAddress: string;
  editImages: string[];
  onEditStart: (event: Event) => void;
  onEditSave: (eventId: string) => void;
  onEditCancel: () => void;
  onTitleChange: (value: string) => void;
  onTextChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onImagesChange: (images: string[]) => void;
  onEmojiSelect: (emoji: string) => void;
  onDelete?: (id: string) => void;
  onStatusClick: (event: Event) => void;
  onStatusChange?: ((id: string, status: string) => void) | undefined;
  onLikeToggle?: (event: Event) => void;
  isReadOnly?: boolean;
  onCopyEvent?: (event: Event) => void;
  copiedEventIds?: Set<string>;
  copyingEventId?: string | null;
  onShareEvent?: (taskId: string, d1: string, d2: string) => Promise<string>;
  onGetVotes?: (taskId: string) => Promise<{ 1: number; 2: number; total: number }>;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  expandedImage,
  onImageClick,
  onCloseImage,
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
  onLikeToggle,
  isReadOnly,
  onCopyEvent,
  copiedEventIds,
  copyingEventId,
  onShareEvent,
  onGetVotes,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!event) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onEditCancel();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [event, onClose, onEditCancel]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (event) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [event]);

  if (!event) return null;

  const isSharedEvent = event.sharedFromUserId != null && event.sharedFromUserId !== "";
  const statusToUse = isSharedEvent ? "friends" : event.status;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onEditCancel();
      onClose();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6"
        style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        onClick={handleBackdropClick}
      >
        <div
          ref={containerRef}
          className="event-detail-modal relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border"
          style={{
            background: getStatusColor(statusToUse),
            backgroundColor: "#0a0015",
            borderColor: getStatusBorderColor(statusToUse),
            boxShadow: getStatusShadow(statusToUse),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={() => { onEditCancel(); onClose(); }}
            className="absolute top-3 right-3 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors text-sm"
            aria-label="Close"
          >
            ✕
          </button>

          <div className="p-5 sm:p-7">
            <TaskCardContent
              task={event}
              editingId={editingId}
              editTitle={editTitle}
              editText={editText}
              editDueDate={editDueDate}
              editStartTime={editStartTime}
              editAddress={editAddress}
              editImages={editImages}
              onEditStart={onEditStart}
              onEditSave={onEditSave}
              onEditCancel={onEditCancel}
              onTitleChange={onTitleChange}
              onTextChange={onTextChange}
              onDueDateChange={onDueDateChange}
              onStartTimeChange={onStartTimeChange}
              onAddressChange={onAddressChange}
              onImagesChange={onImagesChange}
              onEmojiSelect={onEmojiSelect}
              onStatusClick={onStatusClick}
              onStatusChange={onStatusChange}
              onImageClick={onImageClick}
              isReadOnly={isReadOnly ?? false}
              {...(onDelete ? { onDelete } : {})}
              {...(onLikeToggle ? { onLikeToggle } : {})}
              {...(onCopyEvent ? { onCopyEvent } : {})}
              {...(copiedEventIds ? { copiedEventIds } : {})}
              {...(copyingEventId !== undefined ? { copyingEventId } : {})}
              {...(onShareEvent ? { onShareEvent } : {})}
              {...(onGetVotes ? { onGetVotes } : {})}
            />
          </div>
        </div>
      </div>

      <ImageModal imageUrl={expandedImage} onClose={onCloseImage} />
    </>
  );
};

export default EventDetailModal;
