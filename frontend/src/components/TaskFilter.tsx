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
  }[] = [
    {
      value: "all",
      label: "All Events",
      icon: "🎉",
      gradient: "from-purple-500 via-pink-500 to-purple-500",
    },
    {
      value: "planned",
      label: "Ideas",
      icon: "💡",
      gradient: "from-yellow-400 via-orange-400 to-yellow-400",
    },
    {
      value: "upcoming",
      label: "Upcoming",
      icon: "📅",
      gradient: "from-blue-500 via-cyan-500 to-blue-500",
    },
    {
      value: "happened",
      label: "Memories",
      icon: "✨",
      gradient: "from-violet-500 via-purple-500 to-violet-500",
    },
    {
      value: "liked",
      label: "Favorites",
      icon: "❤️",
      gradient: "from-red-500 via-pink-500 to-red-500",
    },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => setFilter(f.value)}
          className={`
            px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform
            hover:scale-105 active:scale-95
            ${
              filter === f.value
                ? `bg-gradient-to-r ${f.gradient} text-white shadow-lg shadow-${
                    f.value === "liked" ? "pink" : "purple"
                  }-500/50 scale-105`
                : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white backdrop-blur-sm"
            }
          `}
          title={`Filter by ${f.label}`}
        >
          <span className="mr-2 text-base">{f.icon}</span>
          {f.label}
        </button>
      ))}
    </div>
  );
}
