import React, { useEffect } from "react";

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    if (!imageUrl) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [imageUrl, onClose]);

  if (!imageUrl) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black bg-opacity-95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl z-10 shadow-lg transition-transform hover:scale-110"
          title="Cerrar (ESC)"
        >
          ×
        </button>
        <img
          src={imageUrl}
          alt="Vista ampliada"
          className="max-w-[95vw] max-h-[95vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default ImageModal;
