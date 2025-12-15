import { useState, FormEvent, useRef } from "react";
import { X, CheckCircle, AlertCircle, Upload, User } from "lucide-react";
import { uploadFile } from "../../utils/uploadthing";

interface UsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (username: string, avatarUrl?: string | null) => Promise<void>;
  isLoading?: boolean;
  canClose?: boolean; // If false, modal cannot be closed (username is required)
}

export default function UsernameModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  canClose = true,
}: UsernameModalProps) {
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateUsername = (value: string): string | null => {
    if (!value.trim()) {
      return "Username is required";
    }
    if (value.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (value.length > 20) {
      return "Username must be less than 20 characters";
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return "Username can only contain letters, numbers, and underscores";
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(username.trim(), avatarUrl);
      setUsername("");
      setAvatarUrl(null);
      setAvatarPreview(null);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "object" && err !== null && "message" in err) {
        setError(String(err.message));
      } else {
        setError("Failed to set username. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (value: string) => {
    setUsername(value);
    setError(null);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    setError(null);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to uploadthing
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Set Up Your Profile
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose a username and add your avatar
            </p>
          </div>
          {canClose && !isSubmitting && !isLoading && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div>
            <label
              htmlFor="avatar"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Avatar (Optional)
            </label>
            <div className="flex items-center gap-4">
              {avatarPreview ? (
                <div className="relative">
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    title="Remove avatar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-gray-300">
                  <User className="w-10 h-10 text-white" />
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
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="avatar"
                    className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSubmitting || isLoading || isUploadingAvatar
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {isUploadingAvatar ? (
                      <>
                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-700">
                          Uploading...
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">
                          {avatarPreview ? "Change Avatar" : "Upload Avatar"}
                        </span>
                      </>
                    )}
                  </label>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={isSubmitting || isLoading || isUploadingAvatar}
                      className="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
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
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  error
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                autoFocus
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
              />
              {username && !error && validateUsername(username) === null && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              )}
            </div>
            {error && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Only letters, numbers, and underscores. 3-20 characters.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isLoading || !username.trim()}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSubmitting || isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Setting up...
                </span>
              ) : (
                "Continue"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
