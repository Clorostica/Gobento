import React from "react";

interface TaskImageViewerProps {
  images: string[];
  onImageClick: (image: string) => void;
  onRemoveImage?: (index: number) => void;
}

const TaskImageViewer: React.FC<TaskImageViewerProps> = ({
  images,
  onImageClick,
  onRemoveImage,
}) => {
  if (!images || images.length === 0) return null;

  return (
    <div
      className={`mt-3 grid gap-2 ${
        images.length === 1
          ? "grid-cols-1"
          : images.length === 2
          ? "grid-cols-2"
          : "grid-cols-3"
      }`}
    >
      {images.map((image, index) => {
        const isGif = image.startsWith("data:image/gif");
        return (
          <div key={index} className="relative group">
            <img
              src={image}
              alt={`Task image ${index + 1}`}
              className={`w-full transition-colors cursor-pointer ${
                images.length === 1
                  ? "min-h-[250px] object-contain"
                  : "h-48 object-cover"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onImageClick(image);
              }}
            />
            {isGif && (
              <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded font-medium z-20">
                GIF
              </span>
            )}
            {onRemoveImage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveImage(index);
                }}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
                title="Eliminar imagen"
              >
                ×
              </button>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded flex items-center justify-center pointer-events-none">
              <span className="text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity">
                🔍
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskImageViewer;
