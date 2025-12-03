import React, { useRef, useEffect } from "react";
import EmojiPicker from "../EmojiPicker";
import { convertFileToBase64, compressImage } from "../../utils/imageHandler";

interface TaskEditFormProps {
  taskId: string;
  title: string;
  text: string;
  dueDate: string;
  startTime: string;
  address: string;
  images: string[];
  onTitleChange: (value: string) => void;
  onTextChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onImagesChange: (images: string[]) => void;
  onEmojiSelect: (emoji: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

const TaskEditForm: React.FC<TaskEditFormProps> = ({
  taskId,
  title,
  text,
  dueDate,
  startTime,
  address,
  images,
  onTitleChange,
  onTextChange,
  onDueDateChange,
  onStartTimeChange,
  onAddressChange,
  onImagesChange,
  onEmojiSelect,
  onSave,
  onCancel,
  onDelete,
}) => {
  const titleTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isInitialMount = useRef(true);

  // Initialize title textarea only once on mount
  useEffect(() => {
    if (titleTextareaRef.current && isInitialMount.current) {
      isInitialMount.current = false;
      const textarea = titleTextareaRef.current;
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(60, textarea.scrollHeight)}px`;
      textarea.focus();
      if (title && title.length > 0) {
        textarea.setSelectionRange(title.length, title.length);
      } else {
        textarea.setSelectionRange(0, 0);
      }
    }
  }, []); // Only run once on mount

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const imagePromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith("image/")) return null;

        // Don't compress GIFs to preserve animation
        if (file.type === "image/gif") {
          return await convertFileToBase64(file);
        }

        const compressedFile = await compressImage(file);
        return await convertFileToBase64(compressedFile);
      });

      const newImages = (await Promise.all(imagePromises)).filter(
        (img): img is string => img !== null
      );

      onImagesChange([...images, ...newImages]);
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Error al subir las imágenes. Por favor intenta de nuevo.");
    }

    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Stop propagation to prevent any parent handlers from interfering
    e.stopPropagation();
    // Only update the title, not the description
    onTitleChange(e.target.value);
    const textarea = e.target as HTMLTextAreaElement;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(80, textarea.scrollHeight)}px`;
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Stop propagation to prevent any parent handlers from interfering
    e.stopPropagation();
    // Only update the description (text), not the title
    onTextChange(e.target.value);
    const textarea = e.target as HTMLTextAreaElement;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(120, textarea.scrollHeight)}px`;
  };

  return (
    <div className="space-y-2">
      <textarea
        data-task-id={taskId}
        data-field="title"
        value={title}
        onChange={handleTitleChange}
        maxLength={50}
        className="w-full bg-black bg-opacity-30 text-white p-3 rounded resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-medium"
        rows={2}
        placeholder=""
        style={{ fontSize: "0.875rem", minHeight: "60px" }}
        autoFocus
        ref={titleTextareaRef}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault();
            onSave();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      />

      <div className="flex flex-col gap-1.5">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => onDueDateChange(e.target.value)}
          className="w-full bg-black bg-opacity-30 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
          placeholder="Due date"
        />
        <input
          type="time"
          value={startTime}
          onChange={(e) => onStartTimeChange(e.target.value)}
          className="w-full bg-black bg-opacity-30 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
          placeholder="Time"
        />
        <input
          type="text"
          value={address || ""}
          onChange={(e) => {
            console.log(
              "TaskEditForm - Address input changed:",
              e.target.value
            );
            onAddressChange(e.target.value);
          }}
          onBlur={(e) => {
            console.log(
              "TaskEditForm - Address input blurred:",
              e.target.value
            );
          }}
          className="w-full bg-black bg-opacity-30 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
          placeholder="📍 Address (e.g., 123 Main St, City)"
        />
      </div>

      <textarea
        data-task-id={`${taskId}-description`}
        data-field="description"
        value={text}
        onChange={handleTextareaChange}
        className="w-full bg-black bg-opacity-30 text-white p-3 rounded resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
        rows={4}
        placeholder="Task description"
        style={{ fontSize: "0.875rem", minHeight: "120px" }}
        ref={(textarea) => {
          if (textarea) {
            setTimeout(() => {
              textarea.style.height = "auto";
              textarea.style.height = `${Math.max(
                120,
                textarea.scrollHeight
              )}px`;
            }, 50);
          }
        }}
        onKeyDown={(e) => {
          // Stop all propagation to prevent interference
          e.stopPropagation();
          if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault();
            onSave();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onFocus={(e) => {
          e.stopPropagation();
        }}
      />

      <div className="flex gap-2">
        <EmojiPicker
          onEmojiSelect={onEmojiSelect}
          onGifSelect={(gifUrl: string) => {
            onImagesChange([...images, gifUrl]);
          }}
        />
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <span className="inline-flex items-center justify-center px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs font-medium transition-colors whitespace-nowrap">
            📷 Add img
          </span>
        </label>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image, index) => {
            const isGif = image.startsWith("data:image/gif");
            return (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-20 object-cover rounded border-2 border-purple-400"
                />
                {isGif && (
                  <span className="absolute bottom-1 left-1 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded">
                    GIF
                  </span>
                )}
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={onSave}
            className="text-xs px-3 py-1 bg-purple-500 hover:bg-purple-600 rounded transition-colors text-white"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="text-xs px-3 py-1 bg-gray-500 hover:bg-gray-600 rounded transition-colors text-white"
          >
            Cancel
          </button>
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log(
                "Delete button clicked in edit form for task:",
                taskId
              );
              onDelete(taskId);
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

export default TaskEditForm;
