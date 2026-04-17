import React from "react";

interface SearchProps {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  className?: string;
}

export default function Search({ search, setSearch, className }: SearchProps) {
  return (
    <div
      className={className ?? "relative flex-1 min-w-0 w-full sm:w-[250px] md:w-[300px] lg:w-[320px]"}
      style={{
        display: "flex",
        alignItems: "center",
        borderRadius: "0.75rem",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.06)",
        transition: "border-color 0.2s",
      }}
      onFocusCapture={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(251,146,60,0.5)";
      }}
      onBlurCapture={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)";
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 ml-3 w-3.5 h-3.5"
        style={{ color: "rgba(255,255,255,0.35)" }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      <input
        type="text"
        placeholder="Search events & people…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 min-w-0 bg-transparent outline-none px-2.5 py-2 sm:py-2.5 text-sm"
        style={{ color: "rgba(255,255,255,0.85)", caretColor: "rgba(251,146,60,0.9)" }}
      />

      {search && (
        <button
          type="button"
          onClick={() => setSearch("")}
          className="flex-shrink-0 mr-2 p-1 rounded-md transition-colors"
          style={{ color: "rgba(255,255,255,0.3)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
          aria-label="Clear search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
