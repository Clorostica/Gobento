import React, { useRef, useEffect, useState } from "react";
import { compressImage } from "../../utils/imageHandler";
import { uploadMultipleFiles } from "../../utils/uploadthing";

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
  const descriptionTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isInitialMount = useRef(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const emojiScrollRef = useRef<HTMLDivElement | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const emojis = [
    "😊",
    "😂",
    "🥰",
    "😍",
    "🤩",
    "😎",
    "🤗",
    "🙂",
    "😌",
    "😏",
    "❤️",
    "💕",
    "💖",
    "💗",
    "💙",
    "💚",
    "💛",
    "🧡",
    "💜",
    "🖤",
    "👍",
    "👏",
    "🙌",
    "👌",
    "✌️",
    "🤞",
    "🤝",
    "💪",
    "🙏",
    "✊",
    "🎉",
    "🎊",
    "🎈",
    "🎁",
    "🎀",
    "🎂",
    "🍰",
    "🎯",
    "🎨",
    "🎭",
    "🔥",
    "⭐",
    "✨",
    "💫",
    "⚡",
    "☀️",
    "🌙",
    "🌟",
    "💥",
    "🌈",
    "📌",
    "📍",
    "📎",
    "✏️",
    "📝",
    "💡",
    "🔔",
    "⏰",
    "📅",
    "📆",
    "✅",
    "❌",
    "⚠️",
    "🚀",
    "🎯",
    "🏆",
    "🥇",
    "🎖️",
    "⚙️",
    "🔧",
  ];

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
  }, []);

  // Cerrar el picker al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      // Filter only image files
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (imageFiles.length === 0) {
        alert("Please select valid image files.");
        e.target.value = "";
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      // Compress images (except GIFs) before uploading
      const processedFiles = await Promise.all(
        imageFiles.map(async (file) => {
          if (file.type === "image/gif") {
            return file;
          }
          return await compressImage(file);
        })
      );

      // Upload files to uploadthing with progress tracking
      const uploadedUrls = await uploadMultipleFiles(
        processedFiles,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Add the uploaded URLs to the images array
      onImagesChange([...images, ...uploadedUrls]);
      setUploadProgress(100);

      // Reset progress after a short delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Error al subir las imágenes. Por favor intenta de nuevo.");
      setIsUploading(false);
      setUploadProgress(0);
    }

    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    onTitleChange(e.target.value);
    const textarea = e.target as HTMLTextAreaElement;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(80, textarea.scrollHeight)}px`;
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    onTextChange(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(120, textarea.scrollHeight)}px`;
  };

  const insertEmoji = (emoji: string) => {
    if (!descriptionTextareaRef.current) return;
    const textarea = descriptionTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + emoji + text.substring(end);
    onTextChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
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

      <div className="relative">
        <textarea
          data-task-id={`${taskId}-description`}
          data-field="description"
          value={text}
          onChange={handleTextareaChange}
          className="w-full bg-black bg-opacity-30 text-white p-3 pb-10 rounded resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
          rows={4}
          placeholder="Task description"
          style={{ fontSize: "0.875rem", minHeight: "120px" }}
          ref={descriptionTextareaRef}
        />

        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="absolute bottom-2 right-2 hover:bg-opacity-50 text-white p-2 rounded transition-all"
          title="Add emoji"
        >
          😊
        </button>

        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-12 right-0 bg-black bg-opacity-90 backdrop-blur-sm border border-purple-400 rounded-lg p-2 shadow-lg z-50"
            style={{ width: "280px", maxHeight: "240px" }}
          >
            {/* Flecha arriba */}
            <button
              type="button"
              onClick={() => {
                if (emojiScrollRef.current) {
                  emojiScrollRef.current.scrollBy({
                    top: -60,
                    behavior: "smooth",
                  });
                }
              }}
              className="w-full flex justify-center items-center p-1 mb-1 hover:bg-purple-400 hover:bg-opacity-20 rounded transition-all"
              title="Scroll up"
            >
              <svg
                className="w-4 h-4 text-purple-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>

            {/* Contenedor de emojis con scroll */}
            <div
              ref={emojiScrollRef}
              className="grid grid-cols-8 gap-2 overflow-y-auto max-h-44 scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-transparent"
              style={{ scrollbarWidth: "thin" }}
            >
              {emojis.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    insertEmoji(emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-2xl hover:bg-purple-400 hover:bg-opacity-20 rounded p-1 transition-all hover:scale-110"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Flecha abajo */}
            <button
              type="button"
              onClick={() => {
                if (emojiScrollRef.current) {
                  emojiScrollRef.current.scrollBy({
                    top: 60,
                    behavior: "smooth",
                  });
                }
              }}
              className="w-full flex justify-center items-center p-1 mt-1 hover:bg-purple-400 hover:bg-opacity-20 rounded transition-all"
              title="Scroll down"
            >
              <svg
                className="w-4 h-4 text-purple-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image, index) => {
            // Check if it's a URL (uploadthing) or base64 (legacy)
            const isUrl =
              image.startsWith("http://") || image.startsWith("https://");
            const isGif =
              image.includes("gif") ||
              (isUrl && image.toLowerCase().includes(".gif"));
            return (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-40 object-cover rounded border-2 border-purple-400"
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

      <div className="flex flex-col gap-2">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            disabled={isUploading}
          />
          <span
            className={`button-primary ${
              isUploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            📷 Add img
          </span>
        </label>
        {isUploading && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white">Uploading...</span>
              <span className="text-xs text-white">
                {Math.round(uploadProgress)}%
              </span>
            </div>
            <div className="w-full bg-black bg-opacity-30 rounded-full h-2">
              <div
                className="bg-purple-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 items-center justify-between">
        <div className="flex gap-2">
          <button onClick={onSave} className="button-primary">
            Save
          </button>
          <button onClick={onCancel} className="button-primary">
            Cancel
          </button>
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
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
