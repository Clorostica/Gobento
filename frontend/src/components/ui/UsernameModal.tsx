import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { X, CheckCircle, AlertCircle, Upload, User } from "lucide-react";
import { uploadFile } from "../../utils/uploadthing";

interface UsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (username: string, avatarUrl?: string | null) => Promise<void>;
  isLoading?: boolean;
  canClose?: boolean;
  onCancel?: () => void;
  isNewlyCreatedUser?: boolean;
  currentUsername?: string;
  currentAvatarUrl?: string | null;
}

export default function UsernameModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  canClose = true,
  onCancel,
  isNewlyCreatedUser = false,
  currentUsername = "",
  currentAvatarUrl = null,
}: UsernameModalProps) {
  const [username, setUsername] = useState(currentUsername);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-sync state whenever the modal opens so pre-filled values are current
  useEffect(() => {
    if (isOpen) {
      setUsername(currentUsername);
      setAvatarUrl(currentAvatarUrl);
      setAvatarPreview(currentAvatarUrl);
      setError(null);
    }
  }, [isOpen, currentUsername, currentAvatarUrl]);

  if (!isOpen) return null;

  const validateUsername = (value: string): string | null => {
    if (!value.trim()) return "Username is required";
    if (value.length < 3) return "Username must be at least 3 characters";
    if (value.length > 20) return "Username must be less than 20 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Username can only contain letters, numbers, and underscores";
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validateUsername(username);
    if (validationError) { setError(validationError); return; }
    setIsSubmitting(true);
    try {
      await onSubmit(username.trim(), avatarUrl);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else if (typeof err === "object" && err !== null && "message" in err) setError(String(err.message));
      else setError("Failed to set username. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (value: string) => { setUsername(value); setError(null); };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select a valid image file"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image size must be less than 5MB"); return; }
    setIsUploadingAvatar(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
      const uploadedUrl = await uploadFile(file);
      setAvatarUrl(uploadedUrl);
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setError("Failed to upload avatar. Please try again.");
      setAvatarPreview(null);
      setAvatarUrl(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="max-w-md w-full rounded-2xl shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in duration-200"
        style={{
          background: "rgba(5,0,20,0.97)",
          border: "1px solid rgba(139,92,246,0.25)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isNewlyCreatedUser ? "Welcome! Set Up Your Profile" : "Edit Profile"}
            </h2>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              {isNewlyCreatedUser
                ? "Add a username and avatar to complete your account setup"
                : "Update your username and profile picture"}
            </p>
          </div>
          {canClose && !isSubmitting && !isLoading && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
              Profile Picture (Optional)
            </label>
            <div className="flex items-center gap-4">
              {avatarPreview ? (
                <div className="relative flex-shrink-0">
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-18 h-18 rounded-full object-cover"
                    style={{ width: 72, height: 72, border: "2px solid rgba(139,92,246,0.6)" }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white transition-colors"
                    style={{ background: "rgba(239,68,68,0.9)" }}
                    title="Remove avatar"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ width: 72, height: 72, background: "rgba(139,92,246,0.15)", border: "2px solid rgba(139,92,246,0.3)" }}
                >
                  <User className="w-8 h-8" style={{ color: "rgba(139,92,246,0.7)" }} />
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={isSubmitting || isLoading || isUploadingAvatar}
                  className="hidden"
                />
                <label
                  htmlFor="avatar"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-colors text-sm font-medium"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.7)",
                    opacity: isSubmitting || isLoading || isUploadingAvatar ? 0.5 : 1,
                    cursor: isSubmitting || isLoading || isUploadingAvatar ? "not-allowed" : "pointer",
                  }}
                >
                  {isUploadingAvatar ? (
                    <>
                      <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      <span>Uploading…</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>{avatarPreview ? "Change Photo" : "Upload Photo"}</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => handleChange(e.target.value)}
                disabled={isSubmitting || isLoading}
                placeholder="e.g., johndoe123"
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${error ? "rgba(239,68,68,0.6)" : "rgba(139,92,246,0.3)"}`,
                  color: "rgba(255,255,255,0.9)",
                  caretColor: "rgba(139,92,246,0.9)",
                }}
                autoFocus
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
              />
              {username && !error && validateUsername(username) === null && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle className="w-5 h-5" style={{ color: "rgba(52,211,153,0.9)" }} />
                </div>
              )}
            </div>
            {error && (
              <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: "rgba(248,113,113,0.9)" }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <p className="mt-1.5 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              Letters, numbers, and underscores only. 3–20 characters.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            {isNewlyCreatedUser && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting || isLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || isLoading || !username.trim()}
              className={`${isNewlyCreatedUser && onCancel ? "flex-1" : "w-full"} py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.8), rgba(168,85,247,0.8))",
                border: "1px solid rgba(139,92,246,0.4)",
                boxShadow: "0 4px 16px rgba(124,58,237,0.25)",
              }}
            >
              {isSubmitting || isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </span>
              ) : isNewlyCreatedUser ? (
                "Continue"
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
