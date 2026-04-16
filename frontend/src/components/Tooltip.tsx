import React from "react";

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  position?: "bottom" | "left";
}

const Tooltip = ({ label, children, position = "bottom" }: TooltipProps) => {
  const pos =
    position === "left"
      ? "right-full top-1/2 -translate-y-1/2 mr-2"
      : "top-full left-1/2 -translate-x-1/2 mt-2";

  return (
    <div className="relative group/tooltip inline-flex">
      {children}
      <span
        className={`
          pointer-events-none absolute ${pos} z-[100]
          px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap
          bg-black/90 text-white border border-purple-900/50 shadow-lg
          opacity-0 scale-95
          group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100
          transition-all duration-150
        `}
      >
        {label}
      </span>
    </div>
  );
};

export default Tooltip;
