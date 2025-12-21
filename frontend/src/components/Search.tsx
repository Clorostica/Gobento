import React from "react";
import StarBorder from "./StarBorder";

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
    <div className="w-full">
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        <div className="relative flex-1 min-w-0 w-full sm:w-[250px] md:w-[300px] lg:w-[320px]">
          <div className="absolute left-2 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder={
              searchType === "events" ? "Search events..." : "Search users..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 sm:pl-9 md:pl-11 pr-3 sm:pr-4 md:pr-5 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 hover:shadow-md text-sm sm:text-base text-gray-900"
          />
        </div>
        <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
          <StarBorder
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSearchTypeChange("events");
            }}
            className={`flex items-center justify-center p-1.5 sm:p-2 md:p-2.5 transition-all duration-200 cursor-pointer ${
              searchType === "events"
                ? "scale-110"
                : "opacity-70 hover:opacity-100"
            }`}
            color={searchType === "events" ? "#FB923C" : "#B19EEF"}
            speed="6s"
            thickness={0.5}
            title="Search events"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4"
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
          </StarBorder>
          <StarBorder
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSearchTypeChange("users");
            }}
            className={`flex items-center justify-center p-1.5 sm:p-2 md:p-2.5 transition-all duration-200 cursor-pointer ${
              searchType === "users"
                ? "scale-110"
                : "opacity-70 hover:opacity-100"
            }`}
            color={searchType === "users" ? "#FB923C" : "#B19EEF"}
            speed="6s"
            thickness={0.5}
            title="Search users"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4"
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
          </StarBorder>
        </div>
      </div>
    </div>
  );
}
