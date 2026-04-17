import React, { useState } from "react";

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  position?: "bottom" | "top";
  className?: string;
}

const Tooltip = ({ label, children, position = "bottom", className }: TooltipProps) => {
  const [visible, setVisible] = useState(false);

  const posClass =
    position === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : "top-full left-1/2 -translate-x-1/2 mt-2";

  return (
    <div
      className={`relative inline-flex${className ? ` ${className}` : ""}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          className={`
            pointer-events-none absolute ${posClass} z-[200]
            px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap
            bg-black/90 text-white border border-purple-900/50 shadow-lg
            animate-fade-in
          `}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default Tooltip;
