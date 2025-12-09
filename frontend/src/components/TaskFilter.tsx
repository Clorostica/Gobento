import React from "react";

export type FilterStatus =
  | "all"
  | "planned"
  | "upcoming"
  | "happened"
  | "liked";

interface EventFilterProps {
  filter: FilterStatus;
  setFilter: React.Dispatch<React.SetStateAction<FilterStatus>>;
}

export default function EventFilter({ filter, setFilter }: EventFilterProps) {
  const filters: {
    value: FilterStatus;
    label: string;
    icon: string;
    gradient?: string;
    color?: string;
  }[] = [
    {
      value: "all",
      label: "All Events",
      icon: "🎉",
      gradient: "from-purple-600 via-purple-500 to-purple-600",
      color: "purple",
    },
    {
      value: "planned",
      label: "Ideas",
      icon: "💡",
      gradient: "from-purple-600 via-purple-500 to-purple-600",
      color: "purple",
    },
    {
      value: "upcoming",
      label: "Upcoming",
      icon: "📅",
      gradient: "from-blue-500 via-cyan-500 to-blue-500",
      color: "blue",
    },
    {
      value: "happened",
      label: "Memories",
      icon: "✨",
      gradient: "from-green-500 via-emerald-500 to-green-500",
      color: "green",
    },
    {
      value: "liked",
      label: "Favorites",
      icon: "❤️",
      gradient: "from-red-500 via-pink-500 to-red-500",
      color: "pink",
    },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => setFilter(f.value)}
          className={`
            px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform
            hover:scale-105 active:scale-95 whitespace-nowrap flex items-center
            ${
              filter === f.value
                ? `bg-gradient-to-r ${f.gradient} text-white shadow-lg shadow-${
                    f.color || "purple"
                  }-500/50 scale-105`
                : "bg-black/20 text-white/80 hover:bg-black/30 hover:text-white backdrop-blur-sm"
            }
          `}
          title={`Filter by ${f.label}`}
        >
          <span className="mr-2 text-base flex-shrink-0">{f.icon}</span>
          <span>{f.label}</span>
        </button>
      ))}
    </div>
  );
}
