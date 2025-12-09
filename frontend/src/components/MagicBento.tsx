import React, { useRef, useEffect, useState } from "react";
import "../magicbento.css";
import type { Event } from "@/types/tasks/task.types";
import ParticleCard from "./bento/ParticleCard";
import TaskCardWithoutStars from "./bento/TaskCardWithoutStars";
import BentoCardGrid from "./bento/BentoCardGrid";
import GlobalSpotlight from "./bento/GlobalSpotlight";
import TaskCardContent from "./bento/TaskCardContent";
import ImageModal from "./bento/ImageModal";
import {
  DEFAULT_PARTICLE_COUNT,
  DEFAULT_SPOTLIGHT_RADIUS,
  DEFAULT_GLOW_COLOR,
  MOBILE_BREAKPOINT,
  getStatusColor,
  getStatusLabel,
  getStatusIcon,
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
  // Event management props
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
  addTask?: (status?: string | "planned" | "upcoming" | "happened") => void;
  currentFilter?: "all" | "planned" | "upcoming" | "happened" | "liked";
  isFollowing?: boolean;
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

  // Equalize card heights - make all cards the same fixed height
  // But skip when editing to prevent interference with textarea resizing
  useEffect(() => {
    // Don't run if currently editing a task
    if (editingId !== null) return;

    const equalizeCardHeights = () => {
      if (!gridRef.current) return;
      // Don't run if editing started during the delay
      if (editingId !== null) return;

      const cards = gridRef.current.querySelectorAll(
        ".magic-bento-card"
      ) as NodeListOf<HTMLElement>;
      if (cards.length === 0) return;

      // Use fixed height: 500px on desktop, 400px on mobile
      const isMobileView = window.innerWidth <= 599;
      const fixedHeight = isMobileView ? 400 : 500;

      // Apply fixed height to cards, but allow cards with images to expand
      cards.forEach((card) => {
        // Check if this card has images by looking for img elements
        const hasImages = card.querySelector("img") !== null;

        if (hasImages) {
          // Allow cards with images to expand automatically
          card.style.height = "auto";
          card.style.minHeight = `${fixedHeight}px`;
        } else {
          // Cards without images get fixed height
          card.style.height = `${fixedHeight}px`;
          card.style.minHeight = `${fixedHeight}px`;
        }
      });
    };

    // Run after a short delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(equalizeCardHeights, 100);

    // Only listen to resize when not editing
    const handleResize = () => {
      if (editingId === null) {
        equalizeCardHeights();
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [tasks, editingId]); // Re-run when tasks or editing state changes

  const handleEditStart = (event: Event) => {
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
    const statuses: string[] = ["planned", "upcoming", "happened"];
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

  const renderTaskCard = (event: Event, index: number) => {
    const isDragOver = dragOverEventId === event.id;
    const baseClassName = `magic-bento-card ${
      textAutoHide ? "magic-bento-card--text-autohide" : ""
    } ${enableBorderGlow ? "magic-bento-card--border-glow" : ""} ${
      isDragOver ? "ring-4 ring-purple-400 ring-opacity-50" : ""
    }`;

    const eventColor = getStatusColor(event.status);
    const cardProps = {
      className: baseClassName,
      style: {
        background: eventColor,
        borderColor: getStatusBorderColor(event.status),
        boxShadow: getStatusShadow(event.status),
        "--glow-color": glowColor,
        cursor: onReorder && editingId !== event.id ? "grab" : "default",
      } as React.CSSProperties,
    };

    const dragProps =
      onReorder && editingId !== event.id
        ? {
            draggable: true,
            onDragStart: (e: React.DragEvent) => handleDragStart(e, event.id),
            onDragEnd: handleDragEnd,
            onDragOver: (e: React.DragEvent) => handleDragOver(e, event.id),
            onDragLeave: handleDragLeave,
            onDrop: (e: React.DragEvent) => handleDrop(e, event.id),
          }
        : {};

    const handleHeaderKeyDown = (e: React.KeyboardEvent, event: Event) => {
      if (onEdit && editingId !== event.id && editingId === null) {
        const isTyping =
          e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
        if (
          isTyping ||
          e.key === "Backspace" ||
          e.key === "Delete" ||
          e.key === "Enter"
        ) {
          e.preventDefault();
          handleEditStart(event);
          if (isTyping) {
            setTimeout(() => {
              setEditTitle((prev) => {
                const currentTitle = prev || event.title || event.text || "";
                return currentTitle + e.key;
              });
              setTimeout(() => {
                const titleTextarea = document.querySelector(
                  `textarea[data-task-id="${event.id}"]:not([data-task-id*="-description"])`
                ) as HTMLTextAreaElement;
                if (
                  titleTextarea &&
                  !titleTextarea
                    .getAttribute("data-task-id")
                    ?.includes("description")
                ) {
                  titleTextarea.focus();
                  titleTextarea.setSelectionRange(
                    titleTextarea.value.length,
                    titleTextarea.value.length
                  );
                }
              }, 10);
            }, 0);
          } else {
            setTimeout(() => {
              const titleTextarea = document.querySelector(
                `textarea[data-task-id="${event.id}"]:not([data-task-id*="-description"])`
              ) as HTMLTextAreaElement;
              if (titleTextarea) {
                titleTextarea.focus();
              }
            }, 10);
          }
        }
      }
    };

    const cardContentProps: {
      task: Event;
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
      onStatusClick: (event: Event) => void;
      onImageClick: (image: string) => void;
      onHeaderKeyDown: (e: React.KeyboardEvent, event: Event) => void;
      onDelete?: (id: string) => void;
      onLikeToggle?: (event: Event) => void;
    } = {
      task: event,
      editingId,
      editTitle,
      editText,
      editDueDate,
      editStartTime,
      editAddress,
      editImages,
      onEditStart: handleEditStart,
      onEditSave: handleEditSave,
      onEditCancel: handleEditCancel,
      onTitleChange: setEditTitle,
      onTextChange: setEditText,
      onDueDateChange: setEditDueDate,
      onStartTimeChange: setEditStartTime,
      onAddressChange: setEditAddress,
      onImagesChange: setEditImages,
      onEmojiSelect: handleEmojiSelect,
      onStatusClick: handleStatusClick,
      onImageClick: setExpandedImage,
      onHeaderKeyDown: handleHeaderKeyDown,
    };

    if (onDelete) {
      cardContentProps.onDelete = onDelete;
    }
    if (onLikeToggle) {
      cardContentProps.onLikeToggle = () => handleLikeToggle(event);
    }

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

      <ImageModal
        imageUrl={expandedImage}
        onClose={() => setExpandedImage(null)}
      />

      <BentoCardGrid gridRef={gridRef}>
        {tasks.length > 0 ? (
          tasks.map((event, index) => renderTaskCard(event, index))
        ) : isFollowing ? (
          <div className="magic-bento-card col-span-full text-center p-8 opacity-50">
            <p>
              No events yet.{" "}
              {addTask && currentFilter !== "liked" && (
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
        {addTask && currentFilter !== "liked" && (
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
