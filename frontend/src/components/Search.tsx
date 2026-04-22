import React, { useRef, useEffect } from "react";

export interface SearchUserResult {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface SearchEventResult {
  id: string;
  title: string | null;
  text: string | null;
  status: string;
}

interface SearchProps {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  className?: string;
  userResults?: SearchUserResult[];
  eventResults?: SearchEventResult[];
  onSelectUser?: (userId: string) => void;
  onSelectEvent?: (eventId: string) => void;
  isLoadingUsers?: boolean;
}

const STATUS_ICON: Record<string, string> = {
  planned: "💡",
  upcoming: "📅",
  happened: "✨",
  private: "🔒",
};

export default function Search({
  search,
  setSearch,
  className,
  userResults = [],
  eventResults = [],
  onSelectUser,
  onSelectEvent,
  isLoadingUsers = false,
}: SearchProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);

  // Open dropdown when there's a query and results
  useEffect(() => {
    if (search.trim().length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [search, userResults, eventResults]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasResults = userResults.length > 0 || eventResults.length > 0;
  const showDropdown = open && search.trim().length > 0;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className={className ?? "relative flex-1 min-w-0 w-full"}
        style={{
          display: "flex",
          alignItems: "center",
          borderRadius: "0.75rem",
          border: `1px solid ${open ? "rgba(251,146,60,0.5)" : "rgba(255,255,255,0.1)"}`,
          background: "rgba(255,255,255,0.06)",
          transition: "border-color 0.2s",
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
          ref={inputRef}
          type="text"
          placeholder="Search events & people…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => search.trim().length > 0 && setOpen(true)}
          className="flex-1 min-w-0 bg-transparent outline-none px-2.5 py-2 sm:py-2.5 text-sm"
          style={{ color: "rgba(255,255,255,0.85)", caretColor: "rgba(251,146,60,0.9)" }}
        />

        {search && (
          <button
            type="button"
            onClick={() => { setSearch(""); setOpen(false); }}
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

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 rounded-xl overflow-hidden z-[200]"
          style={{
            background: "rgba(5,0,20,0.97)",
            border: "1px solid rgba(139,92,246,0.25)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
            backdropFilter: "blur(16px)",
          }}
        >
          {isLoadingUsers && !hasResults ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-white/40">
              <div className="w-3.5 h-3.5 border-2 border-purple-400/40 border-t-purple-400 rounded-full animate-spin" />
              Searching…
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-4 text-sm text-white/30 text-center">No results for "{search}"</div>
          ) : (
            <>
              {/* People section */}
              {userResults.length > 0 && (
                <div>
                  <div className="px-3 pt-3 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">People</span>
                  </div>
                  {userResults.slice(0, 5).map((u) => (
                    <button
                      key={u.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSearch("");
                        setOpen(false);
                        onSelectUser?.(u.id);
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/[0.06] transition-colors text-left"
                    >
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.username} className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-1 ring-purple-400/40" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-1 ring-purple-400/30">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-white/80 font-medium">@{u.username}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Divider */}
              {userResults.length > 0 && eventResults.length > 0 && (
                <div className="mx-3 my-1 border-t" style={{ borderColor: "rgba(139,92,246,0.1)" }} />
              )}

              {/* Events section */}
              {eventResults.length > 0 && (
                <div>
                  <div className="px-3 pt-2 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Events</span>
                  </div>
                  {eventResults.slice(0, 5).map((ev) => (
                    <button
                      key={ev.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setOpen(false);
                        onSelectEvent?.(ev.id);
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/[0.06] transition-colors text-left"
                    >
                      <span className="text-base flex-shrink-0 w-6 text-center">
                        {STATUS_ICON[ev.status] ?? "🎉"}
                      </span>
                      <span className="text-sm text-white/80 truncate">
                        {ev.title || ev.text || "Untitled event"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
