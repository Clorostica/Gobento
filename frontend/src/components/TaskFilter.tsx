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
  onAddEvent?: () => void;
}

export default function EventFilter({ filter, setFilter, onAddEvent }: EventFilterProps) {
  const filters: {
    value: FilterStatus;
    label: string;
    mobileLabel: string;
    icon: string;
    tooltip: string;
    gradient: string;
    glow: string;
  }[] = [
    {
      value: "all",
      label: "All Events",
      mobileLabel: "All",
      icon: "🎉",
      tooltip: "Show all your events",
      gradient: "linear-gradient(135deg, #7c3aed, #a855f7)",
      glow: "rgba(139,92,246,0.4)",
    },
    {
      value: "planned",
      label: "Ideas",
      mobileLabel: "Ideas",
      icon: "💡",
      tooltip: "Ideas — events you're planning",
      gradient: "linear-gradient(135deg, #7e22ce, #c026d3)",
      glow: "rgba(192,38,211,0.4)",
    },
    {
      value: "upcoming",
      label: "Upcoming",
      mobileLabel: "Soon",
      icon: "📅",
      tooltip: "Upcoming — happening soon",
      gradient: "linear-gradient(135deg, #1d4ed8, #06b6d4)",
      glow: "rgba(59,130,246,0.4)",
    },
    {
      value: "happened",
      label: "Memories",
      mobileLabel: "Memories",
      icon: "✨",
      tooltip: "Memories — past events",
      gradient: "linear-gradient(135deg, #047857, #10b981)",
      glow: "rgba(16,185,129,0.4)",
    },
    {
      value: "private",
      label: "Private",
      mobileLabel: "Private",
      icon: "🔒",
      tooltip: "Private — only visible to you",
      gradient: "linear-gradient(135deg, #374151, #6b7280)",
      glow: "rgba(107,114,128,0.4)",
    },
    {
      value: "liked",
      label: "Favorites",
      mobileLabel: "Likes",
      icon: "❤️",
      tooltip: "Favorites — events you liked",
      gradient: "linear-gradient(135deg, #be123c, #f43f5e)",
      glow: "rgba(244,63,94,0.4)",
    },
    {
      value: "friends",
      label: "Friends",
      mobileLabel: "Friends",
      icon: "👥",
      tooltip: "Friends — events from people you follow",
      gradient: "linear-gradient(135deg, #b45309, #f59e0b)",
      glow: "rgba(245,158,11,0.4)",
    },
  ];

  return (
    <>
      {filters.map((f) => {
        const isActive = filter === f.value;
        return (
          <React.Fragment key={f.value}>
            {/* Mobile: icon-only with native title tooltip */}
            <span className="sm:hidden flex-shrink-0">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setFilter(f.value)}
                title={f.tooltip}
                aria-label={f.label}
                className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ease-out ${
                  isActive ? "text-white" : "text-white/50 active:text-white/80"
                }`}
                style={isActive ? { background: f.gradient, boxShadow: `0 2px 12px ${f.glow}` } : undefined}
              >
                <span className="text-xl leading-none">{f.icon}</span>
              </button>
            </span>

            {/* Desktop: Tooltip + label */}
            <Tooltip label={f.tooltip} position="bottom" className="hidden sm:inline-flex flex-shrink-0">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setFilter(f.value)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ease-out ${
                  isActive ? "text-white" : "text-white/40 hover:text-white/75"
                }`}
                style={isActive ? { background: f.gradient, boxShadow: `0 2px 12px ${f.glow}` } : undefined}
              >
                <span className="text-sm leading-none flex-shrink-0">{f.icon}</span>
                <span>{f.label}</span>
              </button>
            </Tooltip>
          </React.Fragment>
        );
      })}

      {/* Add event — icon-only on mobile, icon+label on sm+ */}
      {onAddEvent && (
        <>
          {/* Mobile: icon-only with native tooltip */}
          <button
            onClick={onAddEvent}
            title="Add new event"
            aria-label="Add new event"
            className="sm:hidden flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl text-white/50 hover:text-white transition-all border border-dashed border-white/20 hover:border-purple-400/60 hover:bg-purple-500/10 ml-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Desktop: icon + label with Tooltip */}
          <Tooltip label="Add new event" position="bottom" className="hidden sm:inline-flex flex-shrink-0 ml-1">
            <button
              onClick={onAddEvent}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-white/50 hover:text-white transition-all duration-200 border border-dashed border-white/20 hover:border-purple-400/60 hover:bg-purple-500/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs font-semibold">Add</span>
            </button>
          </Tooltip>
        </>
      )}
    </>
  );
}
