import React from "react";

interface TaskImageViewerProps {
  images: string[];
  onImageClick: (image: string) => void;
}

const TaskImageViewer: React.FC<TaskImageViewerProps> = ({
  images,
  onImageClick,
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
          <div
            key={index}
            className="relative cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(image);
            }}
          >
            <img
              src={image}
              alt={`Task image ${index + 1}`}
              className="w-full h-48 object-cover rounded border-2 border-purple-400 hover:border-purple-300 transition-colors"
            />
            {isGif && (
              <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded font-medium">
                GIF
              </span>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded flex items-center justify-center">
              <span className="text-white text-xs opacity-0 group-hover:opacity-100">
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
