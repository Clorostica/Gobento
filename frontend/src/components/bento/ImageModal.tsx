import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imageUrl) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [imageUrl, onClose]);

  // Tilt effect — same as ParticleCard
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = imgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normX = (x - rect.width / 2) / (rect.width / 2);
    const normY = (y - rect.height / 2) / (rect.height / 2);
    gsap.to(el, {
      rotateX: normY * -8,
      rotateY: normX * 8,
      duration: 0.15,
      ease: "power2.out",
      transformPerspective: 1000,
    });
  };

  const handleMouseLeave = () => {
    const el = imgRef.current;
    if (!el) return;
    gsap.to(el, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
      transformPerspective: 1000,
    });
  };

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full flex items-center justify-center"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-full w-10 h-10 flex items-center justify-center text-xl z-10 shadow-lg transition-all hover:scale-110 border border-white/10"
          title="Close (ESC)"
        >
          ✕
        </button>
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Expanded view"
          className="max-w-[95vw] max-h-[90vh] w-auto h-auto object-contain rounded-2xl shadow-2xl"
          style={{ willChange: "transform" }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default ImageModal;
