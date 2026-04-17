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
    activeGradient: string;
    glowColor: string;
  }[] = [
    {
      value: "all",
      label: "All Events",
      icon: "🎉",
      tooltip: "Show all your events",
      activeGradient: "from-violet-600 to-purple-500",
      glowColor: "rgba(139,92,246,0.35)",
    },
    {
      value: "planned",
      label: "Ideas",
      icon: "💡",
      tooltip: "Events you're planning",
      activeGradient: "from-purple-600 to-fuchsia-500",
      glowColor: "rgba(168,85,247,0.35)",
    },
    {
      value: "upcoming",
      label: "Upcoming",
      icon: "📅",
      tooltip: "Events happening soon",
      activeGradient: "from-blue-500 to-cyan-400",
      glowColor: "rgba(59,130,246,0.35)",
    },
    {
      value: "happened",
      label: "Memories",
      icon: "✨",
      tooltip: "Past events & memories",
      activeGradient: "from-emerald-500 to-teal-400",
      glowColor: "rgba(16,185,129,0.35)",
    },
    {
      value: "private",
      label: "Private",
      icon: "🔒",
      tooltip: "Only visible to you",
      activeGradient: "from-slate-600 to-zinc-500",
      glowColor: "rgba(100,116,139,0.35)",
    },
    {
      value: "liked",
      label: "Favorites",
      icon: "❤️",
      tooltip: "Events you've liked",
      activeGradient: "from-rose-500 to-pink-400",
      glowColor: "rgba(244,63,94,0.35)",
    },
    {
      value: "friends",
      label: "Friends",
      icon: "👥",
      tooltip: "Events from people you follow",
      activeGradient: "from-amber-500 to-orange-400",
      glowColor: "rgba(245,158,11,0.35)",
    },
  ];

  return (
    <>
      {filters.map((f) => {
        const isActive = filter === f.value;
        return (
          <Tooltip key={f.value} label={f.tooltip}>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setFilter(f.value)}
              className={`
                group relative overflow-hidden
                px-4 py-2.5 rounded-2xl
                text-sm font-semibold whitespace-nowrap
                flex items-center gap-2
                transition-all duration-250 ease-out
                ${isActive
                  ? `bg-gradient-to-r ${f.activeGradient} text-white shadow-lg`
                  : "bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                }
              `}
              style={isActive ? {
                boxShadow: `0 4px 20px ${f.glowColor}, 0 1px 0 rgba(255,255,255,0.15) inset`,
              } : undefined}
            >
              {/* Shine sweep on active */}
              {isActive && (
                <span
                  className="pointer-events-none absolute inset-0 -translate-x-full animate-[shine_2.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  aria-hidden="true"
                />
              )}
              <span className="relative text-[15px] flex-shrink-0 leading-none">{f.icon}</span>
              <span className="relative hidden sm:inline tracking-tight">{f.label}</span>
            </button>
          </Tooltip>
        );
      })}
    </>
  );
}
