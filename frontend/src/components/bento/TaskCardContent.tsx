import React, { useState, useRef, useEffect } from "react";
import type { Task } from "@/types/tasks/task.types";
import TaskHeader from "./TaskHeader";
import TaskEditForm from "./TaskEditForm";
import TaskDateDisplay from "./TaskDateDisplay";
import TaskImageViewer from "./TaskImageViewer";
import HeartButton from "./HeartButton";
import FloatingCopyButton from "./FloatingCopyButton";
import ShareLinkButton from "./ShareLinkButton";
import TextWithMentions from "./TextWithMentions";
import Tooltip from "../Tooltip";
import { getStatusIcon, getStatusLabel, getStatusLabelText } from "./utils";
import { env } from "@/config/env";

interface CardComment {
  id: string;
  name: string;
  comment: string;
  createdAt: string;
}

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
  onShareEvent?: (taskId: string, dateOption1: string, dateOption2: string) => Promise<string>;
  onGetVotes?: (taskId: string) => Promise<{ 1: number; 2: number; total: number }>;
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
  onShareEvent,
  onGetVotes,
}) => {
  const isEditing = editingId === task.id;
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Instagram-style comments
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [cardComments, setCardComments] = useState<CardComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  const loadComments = async () => {
    if (!task.shareToken || commentsLoaded || commentsLoading) return;
    setCommentsLoading(true);
    try {
      const res = await fetch(`${env.API_URL}/share/${task.shareToken}/comments`);
      const data = await res.json();
      if (data.comments) {
        setCardComments(
          data.comments.map((c: any) => ({
            id: c.id,
            name: c.name,
            comment: c.comment,
            createdAt: c.created_at || c.createdAt || "",
          }))
        );
      }
      setCommentsLoaded(true);
    } catch {
      // silently fail
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleToggleComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!commentsOpen) loadComments();
    setCommentsOpen((v) => !v);
    setShowAllComments(false);
  };

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

      {/* Combined header: title (left) + actions (right) */}
      {!isEditing && (
        <div className="flex items-start gap-2 mb-3 relative z-20">
          {/* Title — grows to fill available space */}
          <div className="flex-1 min-w-0">
            <TaskHeader
              task={task}
              isEditing={isEditing}
              onEditStart={() => onEditStart(task)}
              onStatusClick={() => onStatusClick(task)}
              {...(onHeaderKeyDown
                ? { onKeyDown: (e: React.KeyboardEvent) => onHeaderKeyDown(e, task) }
                : {})}
              isReadOnly={isReadOnly}
              onCopyEvent={onCopyEvent ? () => onCopyEvent(task) : undefined}
              isCopied={copiedEventIds?.has(task.id) || false}
              isCopying={copyingEventId === task.id}
              hideActions={true}
            />
          </div>

          {/* Action buttons — flex-shrink-0 on the right */}
          <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
            {onLikeToggle && (
              <Tooltip label={task.liked ? "Unlike" : "Like"} position="top">
                <HeartButton
                  isLiked={task.liked || false}
                  onToggle={() => onLikeToggle?.(task)}
                  size="md"
                />
              </Tooltip>
            )}
            {!isReadOnly && !task.sharedFromUserId && (
              <div className="relative" ref={statusMenuRef}>
                <Tooltip label={getStatusLabel(task.status)} position="top">
                  <span
                    className="text-lg opacity-60 hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (showStatusMenu) {
                        setShowStatusMenu(false);
                        onStatusClick(task);
                      } else {
                        setShowStatusMenu(true);
                      }
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{ cursor: "pointer" }}
                  >
                    {getStatusIcon(task.status)}
                  </span>
                </Tooltip>

                {showStatusMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-md border border-purple-400/30 rounded-lg shadow-xl z-[100] py-1 min-w-[140px]">
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
                        <span className="text-xs">{getStatusLabelText(status)}</span>
                        {task.status === status && (
                          <span className="ml-auto text-[10px]">●</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {(isReadOnly || !!task.sharedFromUserId) && (
              <Tooltip label={getStatusLabel(task.status)} position="top">
                <span className="text-lg opacity-60">
                  {getStatusIcon(task.status)}
                </span>
              </Tooltip>
            )}
            {/* Bookmark — on shared events acts as remove button */}
            {!!task.sharedFromUserId && !isReadOnly && (
              <Tooltip label="Remove from my profile" position="top">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete?.(task.id);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-purple-400 hover:text-red-400 transition-colors z-10 relative"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="w-full h-full">
                    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                  </svg>
                </button>
              </Tooltip>
            )}
            {onShareEvent && onGetVotes && !isReadOnly && !task.sharedFromUserId && (
              <ShareLinkButton
                task={task}
                onShare={onShareEvent}
                onGetVotes={onGetVotes}
              />
            )}
            {onDelete && !isReadOnly && !task.sharedFromUserId && (
              <Tooltip label="Delete event" position="top">
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
                  className="text-white/40 hover:text-red-300 text-xs px-1.5 py-1 rounded transition-colors z-10 relative"
                  type="button"
                >
                  ✕
                </button>
              </Tooltip>
            )}
          </div>
        </div>
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

            {/* Instagram-style comments — only for owned events with a magic link */}
            {task.shareToken && !isReadOnly && !task.sharedFromUserId && (
              <div className="mt-4 pt-3 border-t border-white/[0.07]">
                <button
                  onClick={handleToggleComments}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  {commentsLoaded
                    ? cardComments.length === 0
                      ? "No comments"
                      : `${cardComments.length} ${cardComments.length === 1 ? "comment" : "comments"}`
                    : "Read comments"}
                  {commentsLoaded && cardComments.length > 0 && (
                    <span className="opacity-60">· {commentsOpen ? "hide" : "view"}</span>
                  )}
                  {commentsLoading && (
                    <span className="inline-block w-3 h-3 border border-white/30 border-t-white/70 rounded-full animate-spin" />
                  )}
                </button>

                {commentsOpen && commentsLoaded && cardComments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {(showAllComments ? cardComments : cardComments.slice(-2)).map((c) => (
                      <div key={c.id} className="flex gap-2 items-start">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 mt-0.5">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-semibold text-white/70 mr-1">{c.name}</span>
                          <span className="text-[11px] text-white/45 break-words">{c.comment}</span>
                        </div>
                      </div>
                    ))}
                    {!showAllComments && cardComments.length > 2 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowAllComments(true); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="text-[11px] text-violet-400/70 hover:text-violet-300 transition-colors"
                      >
                        View all {cardComments.length} comments
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TaskCardContent;
