import React from "react";

interface SearchProps {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  searchType?: "events" | "users";
  onSearchTypeChange?: (type: "events" | "users") => void;
}

export default function Search({
  search,
  setSearch,
  searchType = "events",
  onSearchTypeChange,
}: SearchProps) {
  const handleSearchTypeChange = (type: "events" | "users") => {
    if (onSearchTypeChange) {
      onSearchTypeChange(type);
      // Clear search when switching types
      setSearch("");
    }
  };

  return (
    <div className="w-full sm:w-[320px] md:w-[350px] lg:w-[380px] max-w-full p-3 sm:p-0">
      <div className="relative">
        <input
          type="text"
          placeholder={
            searchType === "events"
              ? "🔍 Search events..."
              : "🔍 Search users..."
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-5 py-3 pr-28 rounded-xl border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 w-full hover:shadow-md text-base text-gray-900"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSearchTypeChange("events");
            }}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              searchType === "events"
                ? "bg-orange-400 text-white shadow-md scale-110"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title="Search events"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSearchTypeChange("users");
            }}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              searchType === "users"
                ? "bg-orange-400 text-white shadow-md scale-110"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title="Search users"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
