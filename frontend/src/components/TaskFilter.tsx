import React from "react";
import Tooltip from "./Tooltip";

export type FilterStatus =
  | "all"
  | "planned"
  | "upcoming"
  | "happened"
  | "private"
  | "liked"
  | "friends";

interface EventFilterProps {
  filter: FilterStatus;
  setFilter: React.Dispatch<React.SetStateAction<FilterStatus>>;
}

export default function EventFilter({ filter, setFilter }: EventFilterProps) {
  const filters: {
    value: FilterStatus;
    label: string;
    icon: string;
    tooltip: string;
    gradient: string;
    glow: string;
  }[] = [
    {
      value: "all",
      label: "All",
      icon: "🎉",
      tooltip: "Show all your events",
      gradient: "linear-gradient(135deg, #7c3aed, #a855f7)",
      glow: "rgba(139,92,246,0.4)",
    },
    {
      value: "planned",
      label: "Ideas",
      icon: "💡",
      tooltip: "Events you're planning",
      gradient: "linear-gradient(135deg, #7e22ce, #c026d3)",
      glow: "rgba(192,38,211,0.4)",
    },
    {
      value: "upcoming",
      label: "Upcoming",
      icon: "📅",
      tooltip: "Events happening soon",
      gradient: "linear-gradient(135deg, #1d4ed8, #06b6d4)",
      glow: "rgba(59,130,246,0.4)",
    },
    {
      value: "happened",
      label: "Memories",
      icon: "✨",
      tooltip: "Past events & memories",
      gradient: "linear-gradient(135deg, #047857, #10b981)",
      glow: "rgba(16,185,129,0.4)",
    },
    {
      value: "private",
      label: "Private",
      icon: "🔒",
      tooltip: "Only visible to you",
      gradient: "linear-gradient(135deg, #374151, #6b7280)",
      glow: "rgba(107,114,128,0.4)",
    },
    {
      value: "liked",
      label: "Favorites",
      icon: "❤️",
      tooltip: "Events you've liked",
      gradient: "linear-gradient(135deg, #be123c, #f43f5e)",
      glow: "rgba(244,63,94,0.4)",
    },
    {
      value: "friends",
      label: "Friends",
      icon: "👥",
      tooltip: "Events from people you follow",
      gradient: "linear-gradient(135deg, #b45309, #f59e0b)",
      glow: "rgba(245,158,11,0.4)",
    },
  ];

  return (
    <>
      {filters.map((f) => {
        const isActive = filter === f.value;
        return (
          <Tooltip key={f.value} label={f.tooltip} position="bottom" className="flex-1">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setFilter(f.value)}
              className={`
                relative w-full flex items-center justify-center gap-1.5
                py-2 px-2 sm:px-3 rounded-xl
                text-xs sm:text-sm font-medium whitespace-nowrap
                transition-all duration-200 ease-out
                ${isActive
                  ? "text-white"
                  : "text-white/40 hover:text-white/75"
                }
              `}
              style={isActive ? {
                background: f.gradient,
                boxShadow: `0 2px 12px ${f.glow}`,
              } : undefined}
            >
              <span className="text-sm sm:text-base leading-none flex-shrink-0">{f.icon}</span>
              <span className="hidden sm:inline truncate">{f.label}</span>
            </button>
          </Tooltip>
        );
      })}
    </>
  );
}
