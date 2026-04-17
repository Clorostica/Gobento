import React, { useEffect, useRef, useState } from "react";
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
  const [canScrollMore, setCanScrollMore] = useState(false);

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

  useEffect(() => {
    if (event) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [event]);

  // Track whether there's more content below to scroll to
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const check = () => {
      setCanScrollMore(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
    };

    check();
    // Re-check after content renders (images may load late)
    const t = setTimeout(check, 300);
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });

    return () => {
      clearTimeout(t);
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
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
        <div className="relative w-full max-w-2xl">
          <div
            ref={containerRef}
            className="event-detail-modal relative w-full max-h-[85vh] overflow-y-auto rounded-2xl border"
            style={{
              background: getStatusColor(statusToUse),
              backgroundColor: "#0a0015",
              borderColor: getStatusBorderColor(statusToUse),
              boxShadow: getStatusShadow(statusToUse),
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(139,92,246,0.3) transparent",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header strip — close button */}
            <div
              className="sticky top-0 z-50 flex items-center justify-end px-4 pt-4 pb-2"
              style={{ background: "linear-gradient(to bottom, #0a0015 80%, transparent)" }}
            >
              <button
                onClick={() => { onEditCancel(); onClose(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all text-xs font-medium border border-white/10 hover:border-white/20"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Close</span>
              </button>
            </div>

            <div className="px-5 pb-6 sm:px-7 sm:pb-8">
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

          {/* Scroll hint — fades out once user reaches the bottom */}
          {canScrollMore && (
            <div
              className="absolute bottom-0 left-0 right-0 h-20 rounded-b-2xl pointer-events-none flex flex-col items-center justify-end pb-3 gap-1"
              style={{
                background: "linear-gradient(to top, rgba(10,0,21,0.95) 0%, transparent 100%)",
              }}
            >
              <span className="text-white/40 text-[10px] font-medium tracking-wide uppercase">scroll</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-white/40 animate-bounce"
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
          )}
        </div>
      </div>

      <ImageModal imageUrl={expandedImage} onClose={onCloseImage} />
    </>
  );
};

export default EventDetailModal;
