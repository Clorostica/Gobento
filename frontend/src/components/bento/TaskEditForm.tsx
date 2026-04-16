import React, { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { compressImage } from "../../utils/imageHandler";
import { uploadMultipleFiles } from "../../utils/uploadthing";
import { useApiClient, useAuth } from "../../hooks";
import { FriendsService, type User } from "../../services";

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
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const addressDropdownRef = useRef<HTMLDivElement | null>(null);
  const [mentionableUsers, setMentionableUsers] = useState<User[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const mentionsRef = useRef<HTMLDivElement | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    bottom: 80,
    right: 20,
  });
  const apiClient = useApiClient();
  const { isAuthenticated } = useAuth0();
  const { token } = useAuth();

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
  }, [title]);

  // Load mentionable users (followers + following)
  useEffect(() => {
    // Only load if user is authenticated and token is available
    if (!isAuthenticated || !token) {
      setMentionableUsers([]);
      return;
    }

    const loadMentionableUsers = async () => {
      try {
        const friendsService = new FriendsService(apiClient);
        const data = await friendsService.getFollowersAndFollowing();

        const allUsers = [...(data.followers || []), ...(data.following || [])];
        const uniqueUsers = allUsers.filter(
          (user, index, self) =>
            index === self.findIndex((u) => u.id === user.id)
        );

        setMentionableUsers(uniqueUsers);
      } catch (error) {
        console.error("Error loading mentionable users:", error);
        // Set empty array on error to prevent issues
        setMentionableUsers([]);
      }
    };

    loadMentionableUsers();
  }, [apiClient, isAuthenticated, token]);

  // Cerrar el picker al hacer click fuera - MEJORADO
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        mentionsRef.current &&
        !mentionsRef.current.contains(event.target as Node) &&
        descriptionTextareaRef.current &&
        !descriptionTextareaRef.current.contains(event.target as Node)
      ) {
        setShowMentions(false);
      }
      if (
        addressDropdownRef.current &&
        !addressDropdownRef.current.contains(event.target as Node) &&
        addressInputRef.current &&
        !addressInputRef.current.contains(event.target as Node)
      ) {
        setShowAddressSuggestions(false);
      }
    };

    if (showEmojiPicker || showMentions || showAddressSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker, showMentions]);

  // Actualizar posición del emoji picker cuando se hace scroll o se redimensiona la ventana
  useEffect(() => {
    if (!showEmojiPicker || !emojiButtonRef.current) return;

    const updatePosition = () => {
      if (emojiButtonRef.current) {
        const rect = emojiButtonRef.current.getBoundingClientRect();
        const panelWidth = 320;
        const panelHeight = 300;
        const padding = 8;

        let right = window.innerWidth - rect.right;
        let bottom = window.innerHeight - rect.top + padding;

        if (right + panelWidth > window.innerWidth) {
          right = window.innerWidth - panelWidth - 20;
        }
        if (bottom + panelHeight > window.innerHeight) {
          bottom = window.innerHeight - panelHeight - 20;
        }
        if (right < 0) right = 20;
        if (bottom < 0) bottom = 20;

        setEmojiPickerPosition({ bottom, right });
      }
    };

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [showEmojiPicker]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
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

      const processedFiles = await Promise.all(
        imageFiles.map(async (file) => {
          if (file.type === "image/gif") {
            return file;
          }
          return await compressImage(file);
        })
      );

      const uploadedUrls = await uploadMultipleFiles(
        processedFiles,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      onImagesChange([...images, ...uploadedUrls]);
      setUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Error uploading images. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
    }

    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    console.log(
      "Removing image at index:",
      index,
      "Updated images:",
      updatedImages
    );
    onImagesChange(updatedImages);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    onTitleChange(e.target.value);
    const textarea = e.target as HTMLTextAreaElement;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(80, textarea.scrollHeight)}px`;
  };

  // MEJORADO: Detección de @ más robusta
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    const value = e.target.value;
    onTextChange(value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(120, textarea.scrollHeight)}px`;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);

    // Regex mejorado: captura @ seguido de letras, números o guión bajo
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1] || "";
      setMentionQuery(query);

      // Mostrar dropdown si hay usuarios disponibles
      if (mentionableUsers.length > 0) {
        setShowMentions(true);
        setSelectedMentionIndex(0);
      }
    } else {
      setShowMentions(false);
    }
  };

  const filteredMentions = mentionableUsers.filter((user) => {
    const username = (user.username || user.email || "").toLowerCase();
    const query = mentionQuery.toLowerCase();

    if (query.length === 0) return true;

    return username.includes(query);
  });

  const insertMention = useCallback(
    (user: User) => {
      if (!descriptionTextareaRef.current) return;
      const textarea = descriptionTextareaRef.current;
      const value = text;
      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPosition);
      const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);

      if (mentionMatch) {
        const username = user.username || user.email || "";
        const beforeMention = textBeforeCursor.substring(
          0,
          mentionMatch.index || 0
        );
        const afterCursor = value.substring(cursorPosition);
        const newText = `${beforeMention}@${username} ${afterCursor}`;
        onTextChange(newText);

        setTimeout(() => {
          textarea.focus();
          const newCursorPos = (mentionMatch.index || 0) + username.length + 2;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }

      setShowMentions(false);
    },
    [text, onTextChange]
  );

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onAddressChange(value);
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);

    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    if (value.length < 3) return;

    addressDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&addressdetails=1`,
          { headers: { Accept: "application/json" } }
        );
        const data = await res.json();
        const suggestions: string[] = data.map((item: any) => item.display_name);
        setAddressSuggestions(suggestions);
        setShowAddressSuggestions(suggestions.length > 0);
      } catch {
        // silently fail
      }
    }, 350);
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
        <div className="relative">
          <input
            ref={addressInputRef}
            type="text"
            value={address || ""}
            onChange={handleAddressChange}
            onFocus={() => {
              if (addressSuggestions.length > 0) setShowAddressSuggestions(true);
            }}
            className="w-full bg-black bg-opacity-30 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
            placeholder="📍 Address"
            autoComplete="off"
          />
          {showAddressSuggestions && addressSuggestions.length > 0 && (
            <div
              ref={addressDropdownRef}
              className="absolute left-0 right-0 top-full mt-1 bg-black/95 backdrop-blur-sm border border-purple-400/40 rounded-lg shadow-2xl overflow-hidden z-[9999]"
            >
              {addressSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onAddressChange(suggestion);
                    setShowAddressSuggestions(false);
                    setAddressSuggestions([]);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-purple-500/30 transition-colors border-b border-white/5 last:border-b-0 truncate"
                >
                  📍 {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <textarea
          data-task-id={`${taskId}-description`}
          data-field="description"
          value={text}
          onChange={handleTextareaChange}
          onKeyDown={(e) => {
            if (showMentions && filteredMentions.length > 0) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedMentionIndex((prev) =>
                  prev < filteredMentions.length - 1 ? prev + 1 : prev
                );
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : 0));
              } else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                const selectedUser = filteredMentions[selectedMentionIndex];
                if (selectedUser) {
                  insertMention(selectedUser);
                }
              } else if (e.key === "Escape") {
                e.preventDefault();
                setShowMentions(false);
              }
            }
          }}
          className="w-full bg-black bg-opacity-30 text-white p-3 pb-10 rounded resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
          rows={4}
          placeholder="Event description (type @ to mention users)"
          style={{ fontSize: "0.875rem", minHeight: "120px" }}
          ref={descriptionTextareaRef}
        />

        <button
          ref={emojiButtonRef}
          type="button"
          onClick={() => {
            if (emojiButtonRef.current) {
              const rect = emojiButtonRef.current.getBoundingClientRect();
              const panelWidth = 320;
              const panelHeight = 300;
              const padding = 8;

              // Calcular posición: arriba del botón, alineado a la derecha
              let right = window.innerWidth - rect.right;
              let bottom = window.innerHeight - rect.top + padding;

              // Asegurar que no se salga de la pantalla
              if (right + panelWidth > window.innerWidth) {
                right = window.innerWidth - panelWidth - 20;
              }
              if (bottom + panelHeight > window.innerHeight) {
                bottom = window.innerHeight - panelHeight - 20;
              }
              if (right < 0) right = 20;
              if (bottom < 0) bottom = 20;

              setEmojiPickerPosition({ bottom, right });
            }
            setShowEmojiPicker(!showEmojiPicker);
          }}
          className="absolute bottom-2 right-2 hover:bg-opacity-50 text-white p-2 rounded transition-all"
          title="Add emoji"
        >
          😊
        </button>

        {showMentions && filteredMentions.length > 0 && (
          <div
            ref={mentionsRef}
            className="absolute bg-black bg-opacity-95 backdrop-blur-sm border-2 border-purple-400 rounded-lg shadow-2xl max-h-48 overflow-y-auto"
            style={{
              bottom: "calc(100% + 8px)",
              left: "0",
              right: "0",
              minWidth: "220px",
              maxWidth: "100%",
              zIndex: 9999,
            }}
          >
            <div className="px-2 py-1 text-xs text-purple-300 border-b border-purple-400/30 bg-purple-900/30">
              💬 Mention user ({filteredMentions.length})
            </div>
            {filteredMentions.map((user, index) => (
              <button
                key={user.id}
                type="button"
                onClick={() => insertMention(user)}
                className={`w-full text-left px-3 py-2.5 hover:bg-purple-500/40 transition-colors border-b border-purple-400/10 last:border-b-0 ${
                  index === selectedMentionIndex ? "bg-purple-500/40" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 font-bold text-lg">@</span>
                  <span className="text-white text-sm font-medium">
                    {user.username || user.email}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {showEmojiPicker &&
          createPortal(
            <div
              ref={emojiPickerRef}
              className="fixed bg-black bg-opacity-95 backdrop-blur-md border-2 border-purple-400 rounded-xl shadow-2xl flex flex-col"
              style={{
                width: "320px",
                height: "300px",
                bottom: `${emojiPickerPosition.bottom}px`,
                right: `${emojiPickerPosition.right}px`,
                zIndex: 99999999,
              }}
            >
              {/* Header with title and close button */}
              <div className="flex items-center justify-between p-3 border-b border-purple-400/30 flex-shrink-0">
                <span className="text-purple-300 font-semibold text-sm flex items-center gap-2">
                  ✨ Emojis
                </span>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(false)}
                  className="text-gray-400 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors"
                  title="Close"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Contenedor de scroll vertical */}
              <div
                ref={emojiScrollRef}
                className="emoji-picker-scroll p-2 grid grid-cols-6 gap-1"
                style={{
                  flex: "1 1 0%",
                  minHeight: 0,
                  overflowY: "auto",
                  overflowX: "hidden",
                  scrollbarWidth: "thin",
                  scrollbarColor: "#a855f7 transparent",
                  height: "100%",
                }}
              >
                {emojis.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      insertEmoji(emoji);
                    }}
                    className="text-2xl hover:bg-purple-400 hover:bg-opacity-20 rounded p-1 transition-all hover:scale-125"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Footer opcional para indicar que se puede seguir haciendo click */}
              <div className="p-2 text-[10px] text-gray-500 text-center border-t border-purple-400/10 flex-shrink-0">
                Click on an emoji to add it
              </div>
            </div>,
            document.body
          )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image, index) => {
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
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(index);
                  }}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload progress bar */}
      {isUploading && (
        <div className="w-full px-0.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-white/50">Uploading…</span>
            <span className="text-[11px] text-white/50">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2 pt-1">
        {/* Add image */}
        <label className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.05] hover:bg-white/[0.09] hover:border-purple-400/40 text-white/60 hover:text-white/90 text-xs font-medium transition-all select-none ${isUploading ? "opacity-40 pointer-events-none" : ""}`}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            disabled={isUploading}
          />
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          Image
        </label>

        <div className="flex-1" />

        {/* Cancel */}
        <button
          onClick={onCancel}
          type="button"
          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white/80 text-xs font-medium transition-all"
        >
          Cancel
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          type="button"
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-semibold shadow-lg shadow-violet-500/20 transition-all active:scale-95"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Save
        </button>

        {/* Delete */}
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
            type="button"
            title="Delete event"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-red-500/15 hover:border-red-400/30 text-white/30 hover:text-red-400 transition-all"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskEditForm;
