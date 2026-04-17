import React, { useRef, useEffect, useState } from "react";
import "../magicbento.css";
import type { Event } from "@/types/tasks/task.types";
import ParticleCard from "./bento/ParticleCard";
import TaskCardWithoutStars from "./bento/TaskCardWithoutStars";
import BentoCardGrid from "./bento/BentoCardGrid";
import GlobalSpotlight from "./bento/GlobalSpotlight";
import TaskCardContent from "./bento/TaskCardContent";
import ImageModal from "./bento/ImageModal";
import EventDetailModal from "./bento/EventDetailModal";
import {
  DEFAULT_PARTICLE_COUNT,
  DEFAULT_SPOTLIGHT_RADIUS,
  DEFAULT_GLOW_COLOR,
  MOBILE_BREAKPOINT,
  getStatusColor,
  getStatusBorderColor,
  getStatusShadow,
} from "./bento/utils";

export interface BentoCardProps {
  color?: string;
  title?: string;
  description?: string;
  label?: string;
  textAutoHide?: boolean;
  disableAnimations?: boolean;
}

export interface BentoProps {
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  disableAnimations?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  enableTilt?: boolean;
  glowColor?: string;
  clickEffect?: boolean;
  enableMagnetism?: boolean;

  tasks?: Event[];
  onEdit?: (
    id: string,
    title: string,
    text: string,
    dueDate?: string | null,
    startTime?: string | null,
    images?: string[],
    address?: string | null
  ) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (
    id: string,
    newStatus: string | "planned" | "upcoming" | "happened"
  ) => void;
  onReorder?: (draggedEventId: string, targetEventId: string) => void;
  onLikeToggle?: (id: string, liked: boolean) => void;
  addTask?: (
    status?: string | "planned" | "upcoming" | "happened" | "private"
  ) => void;
  currentFilter?:
    | "all"
    | "planned"
    | "upcoming"
    | "happened"
    | "private"
    | "liked"
    | "friends";
  isFollowing?: boolean;
  isReadOnly?: boolean;
  onCopyEvent?: (event: Event) => void;
  copiedEventIds?: Set<string>;
  copyingEventId?: string | null;
  onShareEvent?: (taskId: string, dateOption1: string, dateOption2: string) => Promise<string>;
  onGetVotes?: (taskId: string) => Promise<{ 1: number; 2: number; total: number }>;
}

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () =>
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};

const MagicBento: React.FC<BentoProps> = ({
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = false,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = true,
  tasks = [],
  onEdit,
  onDelete,
  onStatusChange,
  onReorder,
  onLikeToggle,
  addTask,
  currentFilter = "all",
  isFollowing = true,
  isReadOnly = false,
  onCopyEvent,
  copiedEventIds,
  copyingEventId,
  onShareEvent,
  onGetVotes,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = disableAnimations || isMobile;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editText, setEditText] = useState<string>("");
  const [editDueDate, setEditDueDate] = useState<string>("");
  const [editStartTime, setEditStartTime] = useState<string>("");
  const [editAddress, setEditAddress] = useState<string>("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverEventId, setDragOverEventId] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);


  const handleEditStart = (event: Event) => {
    if (isReadOnly) return; // Prevent editing in read-only mode
    // Prevent editing events shared from other users
    if (event.sharedFromUserId != null) return;
    setEditingId(event.id);
    if (event.title) {
      setEditTitle(event.title);
      setEditText(event.text || "");
    } else if (event.text) {
      // Old event format: only has text, treat it as title
      setEditTitle(event.text);
      setEditText("");
    } else {
      // Empty event
      setEditTitle("");
      setEditText("");
    }
    let dueDateValue = "";
    if (
      event.dueDate &&
      typeof event.dueDate === "string" &&
      event.dueDate.length > 0
    ) {
      const parts = event.dueDate.split("T");
      dueDateValue = parts[0] || "";
    }
    setEditDueDate(dueDateValue);

    let startTimeValue = "";
    if (
      event.startTime &&
      typeof event.startTime === "string" &&
      event.startTime.length > 0
    ) {
      startTimeValue = event.startTime;
    }
    setEditStartTime(startTimeValue);

    let addressValue = "";
    if (
      event.address &&
      typeof event.address === "string" &&
      event.address.length > 0
    ) {
      addressValue = event.address;
    }

    setEditAddress(addressValue);

    // Ensure image_url is included in images array if it exists
    const eventImages = event.images || [];
    const imageUrl = (event as any).imageUrl || (event as any).image_url;
    if (imageUrl && !eventImages.includes(imageUrl)) {
      setEditImages([imageUrl, ...eventImages]);
    } else {
      setEditImages(eventImages);
    }
  };

  const handleEditSave = (eventId: string) => {
    if (onEdit) {
      // Convert empty strings a null
      const dueDateValue = editDueDate?.trim() ? editDueDate.trim() : null;
      const startTimeValue = editStartTime?.trim()
        ? editStartTime.trim()
        : null;
      const addressValue = editAddress?.trim() ? editAddress.trim() : null;

      console.log("Saving event values:", {
        eventId,
        dueDateValue,
        startTimeValue,
        addressValue,
      });

      onEdit(
        eventId,
        editTitle?.trim() || "",
        editText?.trim() || "",
        dueDateValue,
        startTimeValue,
        editImages,
        addressValue
      );

      setEditingId(null);
      setEditTitle("");
      setEditText("");
      setEditDueDate("");
      setEditStartTime("");
      setEditAddress("");
      setEditImages([]);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle("");
    setEditText("");
    setEditDueDate("");
    setEditStartTime("");
    setEditAddress("");
    setEditImages([]);
  };

  const handleEmojiSelect = (emoji: string) => {
    setEditTitle((prev) => prev + emoji);
  };

  const handleStatusClick = (event: Event) => {
    if (!onStatusChange) return;
    // Prevent changing status of events shared from other users
    if (event.sharedFromUserId != null) return;
    const statuses: string[] = ["planned", "upcoming", "happened", "private"];
    const currentIndex = statuses.indexOf(event.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];
    if (nextStatus) {
      onStatusChange(event.id, nextStatus);
    }
  };

  const handleLikeToggle = (event: Event) => {
    if (!onLikeToggle) return;
    const currentLiked = event.liked || false;
    onLikeToggle(event.id, !currentLiked);
  };

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    setDraggedEventId(eventId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", eventId);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedEventId(null);
    setDragOverEventId(null);
  };

  const handleDragOver = (e: React.DragEvent, eventId: string) => {
    e.preventDefault();
    if (!draggedEventId || draggedEventId === eventId || !onReorder) return;

    e.dataTransfer.dropEffect = "move";
    setDragOverEventId(eventId);
  };

  const handleDragLeave = () => {
    setDragOverEventId(null);
  };

  const handleDrop = (e: React.DragEvent, targetEventId: string) => {
    e.preventDefault();
    if (!draggedEventId || !onReorder || draggedEventId === targetEventId)
      return;

    onReorder(draggedEventId, targetEventId);

    setDraggedEventId(null);
    setDragOverEventId(null);
  };

  const renderTaskCard = (event: Event, _index: number) => {
    const isDragOver = dragOverEventId === event.id;
    const baseClassName = `magic-bento-card ${
      textAutoHide ? "magic-bento-card--text-autohide" : ""
    } ${enableBorderGlow ? "magic-bento-card--border-glow" : ""} ${
      isDragOver ? "ring-4 ring-purple-400 ring-opacity-50" : ""
    }`;

    const isSharedEvent =
      event.sharedFromUserId != null &&
      event.sharedFromUserId !== undefined &&
      event.sharedFromUserId !== "";
    const statusToUse = isSharedEvent ? "friends" : event.status;

    const eventColor = getStatusColor(statusToUse);
    const cardProps = {
      className: baseClassName,
      style: {
        background: eventColor,
        borderColor: getStatusBorderColor(statusToUse),
        boxShadow: getStatusShadow(statusToUse),
        "--glow-color": glowColor,
        cursor: onReorder ? "grab" : "pointer",
      } as React.CSSProperties,
    };

    const dragProps =
      onReorder
        ? {
            draggable: true,
            onDragStart: (e: React.DragEvent) => handleDragStart(e, event.id),
            onDragEnd: handleDragEnd,
            onDragOver: (e: React.DragEvent) => handleDragOver(e, event.id),
            onDragLeave: handleDragLeave,
            onDrop: (e: React.DragEvent) => handleDrop(e, event.id),
          }
        : {};

    // In the compact grid card, clicking opens the modal instead of inline edit
    const cardContentProps = {
      task: event,
      editingId: null as null,        // never enter edit mode inline
      editTitle: "",
      editText: "",
      editDueDate: "",
      editStartTime: "",
      editAddress: "",
      editImages: [] as string[],
      onEditStart: (ev: Event) => setExpandedEventId(ev.id), // open modal
      onEditSave: (_id: string) => {},
      onEditCancel: () => {},
      onTitleChange: (_v: string) => {},
      onTextChange: (_v: string) => {},
      onDueDateChange: (_v: string) => {},
      onStartTimeChange: (_v: string) => {},
      onAddressChange: (_v: string) => {},
      onImagesChange: (_imgs: string[]) => {},
      onEmojiSelect: (_e: string) => {},
      onStatusClick: handleStatusClick,
      onStatusChange: onStatusChange,
      onImageClick: (_url: string) => setExpandedEventId(event.id), // open modal for image too
      isReadOnly,
      ...(onDelete ? { onDelete } : {}),
      ...(onLikeToggle ? { onLikeToggle: () => handleLikeToggle(event) } : {}),
      ...(onCopyEvent ? { onCopyEvent } : {}),
      ...(copiedEventIds ? { copiedEventIds } : {}),
      ...(copyingEventId !== undefined ? { copyingEventId } : {}),
      ...(onShareEvent ? { onShareEvent } : {}),
      ...(onGetVotes ? { onGetVotes } : {}),
    };

    const cardContent = <TaskCardContent {...cardContentProps} />;

    if (enableStars) {
      return (
        <ParticleCard
          key={event.id}
          className={cardProps.className}
          style={cardProps.style}
          disableAnimations={shouldDisableAnimations}
          particleCount={particleCount}
          glowColor={glowColor}
          enableTilt={enableTilt}
          clickEffect={clickEffect}
          enableMagnetism={enableMagnetism}
          {...dragProps}
        >
          {cardContent}
        </ParticleCard>
      );
    }

    return (
      <TaskCardWithoutStars
        key={event.id}
        className={cardProps.className}
        style={cardProps.style}
        task={event}
        shouldDisableAnimations={shouldDisableAnimations}
        enableTilt={enableTilt}
        enableMagnetism={enableMagnetism}
        clickEffect={clickEffect}
        glowColor={glowColor}
        {...dragProps}
      >
        {cardContent}
      </TaskCardWithoutStars>
    );
  };

  const expandedEvent = tasks.find((t) => t.id === expandedEventId) ?? null;

  const handleCloseModal = () => {
    handleEditCancel();
    setExpandedEventId(null);
  };

  return (
    <>
      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      )}

      {/* Image modal for outside-modal usage */}
      {!expandedEventId && (
        <ImageModal
          imageUrl={expandedImage}
          onClose={() => setExpandedImage(null)}
        />
      )}

      {/* Event detail modal */}
      <EventDetailModal
        event={expandedEvent}
        onClose={handleCloseModal}
        expandedImage={expandedImage}
        onImageClick={setExpandedImage}
        onCloseImage={() => setExpandedImage(null)}
        editingId={editingId}
        editTitle={editTitle}
        editText={editText}
        editDueDate={editDueDate}
        editStartTime={editStartTime}
        editAddress={editAddress}
        editImages={editImages}
        onEditStart={handleEditStart}
        onEditSave={handleEditSave}
        onEditCancel={handleEditCancel}
        onTitleChange={setEditTitle}
        onTextChange={setEditText}
        onDueDateChange={setEditDueDate}
        onStartTimeChange={setEditStartTime}
        onAddressChange={setEditAddress}
        onImagesChange={setEditImages}
        onEmojiSelect={handleEmojiSelect}
        onStatusClick={handleStatusClick}
        onStatusChange={onStatusChange}
        isReadOnly={isReadOnly}
        {...(onDelete ? { onDelete } : {})}
        {...(onLikeToggle && expandedEvent ? { onLikeToggle: () => handleLikeToggle(expandedEvent) } : {})}
        {...(onCopyEvent ? { onCopyEvent } : {})}
        {...(copiedEventIds ? { copiedEventIds } : {})}
        {...(copyingEventId !== undefined ? { copyingEventId } : {})}
        {...(onShareEvent ? { onShareEvent } : {})}
        {...(onGetVotes ? { onGetVotes } : {})}
      />

      <BentoCardGrid gridRef={gridRef}>
        {tasks.length > 0 ? (
          tasks.map((event, index) => renderTaskCard(event, index))
        ) : isFollowing ? (
          <div className="magic-bento-card col-span-full text-center p-8 opacity-50">
            <p>
              No events yet.{" "}
              {addTask &&
                currentFilter !== "liked" &&
                currentFilter !== "friends" && (
                  <button
                    onClick={() => {
                      const status =
                        currentFilter === "all" ? "planned" : currentFilter;
                      addTask(status as "planned" | "upcoming" | "happened");
                    }}
                    className="text-purple-400 hover:text-purple-300 underline ml-2"
                  >
                    Add one!
                  </button>
                )}
            </p>
          </div>
        ) : null}
        {addTask &&
          currentFilter !== "liked" &&
          currentFilter !== "friends" && (
            <div
              className="magic-bento-card add-new-task-card cursor-pointer flex items-center justify-center hover:opacity-80 transition-opacity border-2 border-dashed border-purple-400"
              onClick={() => {
                const status =
                  currentFilter === "all" ? "planned" : currentFilter;
                addTask(status as "planned" | "upcoming" | "happened");
              }}
              style={
                {
                  backgroundColor: "#060010",
                  "--glow-color": glowColor,
                } as React.CSSProperties
              }
            >
              <div className="text-center">
                <div className="text-4xl mb-2">+</div>
                <div className="magic-bento-card__title">Add New Event</div>
              </div>
            </div>
          )}
      </BentoCardGrid>
    </>
  );
};

export default MagicBento;
