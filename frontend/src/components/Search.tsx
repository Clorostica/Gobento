import React from "react";

interface SearchProps {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  searchType?: "events" | "users";
}

export default function Search({
  search,
  setSearch,
  searchType = "events",
}: SearchProps) {
  return (
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
  );
}
