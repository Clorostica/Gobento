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
    gradient?: string;
    color?: string;
  }[] = [
    {
      value: "all",
      label: "All Events",
      icon: "🎉",
      tooltip: "Show all your events",
      gradient: "from-purple-600 via-purple-500 to-purple-600",
      color: "purple",
    },
    {
      value: "planned",
      label: "Ideas",
      icon: "💡",
      tooltip: "Events you're planning",
      gradient: "from-purple-600 via-purple-500 to-purple-600",
      color: "purple",
    },
    {
      value: "upcoming",
      label: "Upcoming",
      icon: "📅",
      tooltip: "Events happening soon",
      gradient: "from-blue-500 via-cyan-500 to-blue-500",
      color: "blue",
    },
    {
      value: "happened",
      label: "Memories",
      icon: "✨",
      tooltip: "Past events & memories",
      gradient: "from-green-500 via-emerald-500 to-green-500",
      color: "green",
    },
    {
      value: "private",
      label: "Private",
      icon: "🔒",
      tooltip: "Only visible to you",
      gradient: "from-gray-600 via-gray-700 to-gray-600",
      color: "gray",
    },
    {
      value: "liked",
      label: "Favorites",
      icon: "❤️",
      tooltip: "Events you've liked",
      gradient: "from-red-500 via-pink-500 to-red-500",
      color: "pink",
    },
    {
      value: "friends",
      label: "Friends",
      icon: "👥",
      tooltip: "Events from people you follow",
      gradient: "from-orange-500 via-amber-500 to-orange-500",
      color: "orange",
    },
  ];

  return (
    <>
      {filters.map((f) => (
        <Tooltip key={f.value} label={f.tooltip}>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setFilter(f.value)}
            className={`
              flex-1 min-w-0 py-2.5 rounded-xl text-sm font-semibold border-2
              flex items-center justify-center gap-2 whitespace-nowrap
              transition-all duration-200
              ${
                filter === f.value
                  ? `bg-gradient-to-r ${f.gradient} text-white border-white/20`
                  : "bg-black/20 text-white/70 hover:bg-white/5 hover:text-white border-transparent"
              }
            `}
          >
            <span className="text-base flex-shrink-0">{f.icon}</span>
            <span className="hidden sm:inline">{f.label}</span>
          </button>
        </Tooltip>
      ))}
    </>
  );
}
