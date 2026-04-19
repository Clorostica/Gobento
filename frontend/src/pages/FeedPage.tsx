import { useEffect, useLayoutEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useAuth, useApiClient } from "../hooks";
import { env } from "../config/env";
import Header from "../components/Header";
import Search from "../components/Search";
import StarBorder from "../components/StarBorder";
import Tooltip from "../components/Tooltip";
import { UsernameModal } from "../components/ui";
import { UsersService } from "../services";

interface FeedEvent {
  id: string;
  user_id: string;
  title: string;
  text?: string;
  status: string;
  due_date?: string;
  start_time?: string;
  address?: string;
  image_url?: string;
  images?: string[];
  liked?: number;
  username?: string;
  avatar_url?: string;
  share_count?: number;
}

interface Profile {
  id: string;
  email: string;
  username?: string | null;
  avatarUrl?: string | null;
}

const DEFAULT_COLORS = { bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.25)", badge: "bg-purple-900/60 text-purple-300" };
const STATUS_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  planned:  { bg: "rgba(124,58,237,0.08)",  border: "rgba(124,58,237,0.25)",  badge: "bg-purple-900/60 text-purple-300" },
  upcoming: { bg: "rgba(29,78,216,0.08)",   border: "rgba(59,130,246,0.25)",  badge: "bg-blue-900/60 text-blue-300" },
  happened: { bg: "rgba(4,120,87,0.08)",    border: "rgba(16,185,129,0.25)", badge: "bg-emerald-900/60 text-emerald-300" },
  private:  { bg: "rgba(55,65,81,0.08)",    border: "rgba(107,114,128,0.25)", badge: "bg-gray-800 text-gray-400" },
};

const STATUS_LABELS: Record<string, string> = {
  planned: "💡 Idea", upcoming: "📅 Upcoming", happened: "✨ Memory",
};

const STATUS_ICONS: Record<string, string> = {
  planned: "💡", upcoming: "📅", happened: "✨", private: "🔒",
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function FeedPage() {
  const { user, isAuthenticated } = useAuth0();
  const { token, isLoading } = useAuth();
  const apiClient = useApiClient();
  const navigate = useNavigate();
  const headerRef = useRef<HTMLElement>(null);

  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFollowing, setHasFollowing] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cachedUsername, setCachedUsername] = useState<string | null>(() => localStorage.getItem("gobento_username"));
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const usersService = useMemo(() => new UsersService(apiClient), [apiClient]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Update --header-h CSS var for layout spacer
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) document.documentElement.style.setProperty("--header-h", `${h}px`);
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [isLoading]);

  const loadFeed = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${env.API_URL}/events/feed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEvents(data.events || []);
      setHasFollowing((data.following?.length ?? 0) > 0);
    } catch {
      setHasFollowing(false);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${env.API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setProfile(await res.json());
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      loadFeed();
      loadProfile();
    }
  }, [isAuthenticated, token, loadFeed, loadProfile]);

  const handleUsernameSubmit = useCallback(async (username: string, avatarUrl?: string | null) => {
    setIsUpdatingProfile(true);
    try {
      const updated = await usersService.updateUsername(username, avatarUrl);
      if (updated.id) {
        setProfile((prev) => prev ? {
          ...prev,
          username: updated.username ?? null,
          avatarUrl: (updated as any).avatar_url || (updated as any).avatarUrl || null,
        } : null);
        if (updated.username) {
          localStorage.setItem("gobento_username", updated.username);
          setCachedUsername(updated.username);
        }
        setShowEditProfile(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error) throw err;
      throw new Error("Failed to update profile. Please try again.");
    } finally {
      setIsUpdatingProfile(false);
    }
  }, [usersService]);

  const filtered = useMemo(() => {
    if (!search.trim()) return events;
    const q = search.toLowerCase();
    return events.filter(
      (e) =>
        e.title?.toLowerCase().includes(q) ||
        e.text?.toLowerCase().includes(q) ||
        e.username?.toLowerCase().includes(q) ||
        e.address?.toLowerCase().includes(q)
    );
  }, [events, search]);

  const displayName = profile?.username || cachedUsername || user?.name || "";

  if (isLoading) return null;

  return (
    <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/80 border-b border-white/10 shadow-md">
        <div className="flex items-center w-full px-3 sm:px-5 lg:px-8 xl:px-12 py-2.5 sm:py-3">

          <Link to="/feed" className="no-underline flex items-center gap-1.5 sm:gap-2 flex-shrink-0 group mr-4 sm:mr-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 group-hover:text-purple-300 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-white font-extrabold text-base sm:text-lg tracking-tight group-hover:opacity-80 transition-opacity">Gobento</span>
          </Link>

          <div className="h-5 w-px flex-shrink-0 mr-4 sm:mr-5" style={{ background: "rgba(255,255,255,0.15)" }} />

          {isAuthenticated && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Tooltip label="My Events" position="bottom">
                <StarBorder onClick={() => navigate("/")} className="flex items-center justify-center px-2.5 py-2 min-h-[36px] star-border-container cursor-pointer" color="#B19EEF" speed="6s" thickness={2}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </StarBorder>
              </Tooltip>
              <Tooltip label="Home" position="bottom">
                <StarBorder onClick={() => navigate("/feed")} className="flex items-center justify-center px-2.5 py-2 min-h-[36px] star-border-container cursor-pointer" color="#FB923C" speed="6s" thickness={2}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                </StarBorder>
              </Tooltip>
            </div>
          )}

          {/* Search — inline on md+, hidden here on smaller screens */}
          <div className="hidden md:block flex-1 min-w-0 mx-3">
            <Search search={search} setSearch={setSearch} />
          </div>

          {/* Spacer — only on small screens where search is below */}
          <div className="flex-1 md:hidden" />

          <div className="flex-shrink-0 mr-0.5 md:mr-0">
            <Header token={token} API_URL={env.API_URL} initialDisplayName={displayName || null} avatarUrl={profile?.avatarUrl || null} onEditProfile={() => setShowEditProfile(true)} />
          </div>
        </div>

        {/* Search row — only on screens narrower than md */}
        <div className="md:hidden px-4 pb-2.5">
          <Search search={search} setSearch={setSearch} className="relative w-full min-w-0" />
        </div>
      </header>

      <div aria-hidden="true" style={{ height: "var(--header-h, 120px)", flexShrink: 0 }} />

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-7 sm:pt-5 pb-8">

        {/* Not authenticated */}
        {!isAuthenticated && (
          <div className="text-center py-24">
            <p className="text-white/50 text-lg mb-2">Sign in to see your friends' events</p>
          </div>
        )}

        {/* Loading */}
        {isAuthenticated && loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
            <p className="text-white/40 text-sm">Loading feed…</p>
          </div>
        )}

        {/* Not following anyone */}
        {isAuthenticated && !loading && hasFollowing === false && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-white font-semibold text-xl mb-2">Your feed is empty</h2>
            <p className="text-white/40 text-sm mb-6">Follow people to see their events here</p>
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.6), rgba(168,85,247,0.6))", border: "1px solid rgba(139,92,246,0.4)" }}
            >
              Go to my events →
            </button>
          </div>
        )}

        {/* Following but no events */}
        {isAuthenticated && !loading && hasFollowing === true && events.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/50 text-base mb-1">No events from your friends yet</p>
            <p className="text-white/30 text-sm">Check back soon</p>
          </div>
        )}

        {/* Feed */}
        {isAuthenticated && !loading && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((event) => {
              const colors = STATUS_COLORS[event.status] ?? DEFAULT_COLORS;
              const firstImage = event.images?.[0] || event.image_url;
              const initial = (event.username || "?").charAt(0).toUpperCase();
              const isViral = (event.share_count ?? 0) >= 100;

              return (
                <article
                  key={event.id}
                  className={`rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${isViral ? "viral-event" : ""}`}
                  style={{
                    background: colors.bg,
                    border: isViral ? "1px solid transparent" : `1px solid ${colors.border}`,
                    backgroundImage: isViral
                      ? `${colors.bg}, linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6, #06b6d4, #f59e0b)`
                      : undefined,
                    backgroundOrigin: isViral ? "border-box" : undefined,
                    backgroundClip: isViral ? "padding-box, border-box" : undefined,
                    boxShadow: isViral ? "0 0 24px rgba(245,158,11,0.3), 0 0 48px rgba(139,92,246,0.2)" : undefined,
                  }}
                >
                  {/* Card header: author */}
                  <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
                    <button
                      onClick={() => navigate(`/user/${event.user_id}`)}
                      className="flex items-center gap-2.5 group"
                    >
                      {event.avatar_url ? (
                        <img src={event.avatar_url} alt={event.username || ""} className="w-8 h-8 rounded-full ring-2 ring-purple-500/30 object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm ring-2 ring-purple-500/20 flex-shrink-0">
                          {initial}
                        </div>
                      )}
                      <span className="text-white/80 text-sm font-medium group-hover:text-purple-300 transition-colors">
                        @{event.username || "user"}
                      </span>
                    </button>

                    <div className="flex items-center gap-2 ml-auto">
                      {isViral && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-gradient-to-r from-amber-500/30 to-pink-500/30 border border-amber-400/40 text-amber-300 animate-pulse">
                          🔥 {event.share_count}+ shares
                        </span>
                      )}
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                        {STATUS_ICONS[event.status]} {STATUS_LABELS[event.status] || event.status}
                      </span>
                    </div>
                  </div>

                  {/* Image */}
                  {firstImage && (
                    <div className="px-4 mb-3">
                      <img
                        src={firstImage}
                        alt={event.title}
                        className="w-full rounded-xl object-cover max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => navigate(`/user/${event.user_id}`)}
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="px-4 pb-4">
                    {event.title && (
                      <h3 className="text-white font-semibold text-base mb-1 leading-snug">{event.title}</h3>
                    )}
                    {event.text && event.text !== event.title && (
                      <p className="text-white/60 text-sm leading-relaxed line-clamp-3">{event.text}</p>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
                      {event.due_date && (
                        <span className="text-white/40 text-xs flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {new Date(event.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                      {event.address && (
                        <span className="text-white/40 text-xs flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {event.address}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <UsernameModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSubmit={handleUsernameSubmit}
        isLoading={isUpdatingProfile}
        canClose={true}
        currentUsername={profile?.username || ""}
        currentAvatarUrl={profile?.avatarUrl || null}
      />

      {/* Scroll to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
        className="fixed bottom-6 right-5 z-[300] w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ease-out"
        style={{
          background: "rgba(0,0,0,0.7)",
          border: "1px solid rgba(139,92,246,0.4)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 20px rgba(139,92,246,0.2)",
          opacity: showScrollTop ? 1 : 0,
          transform: showScrollTop ? "translateY(0)" : "translateY(16px)",
          pointerEvents: showScrollTop ? "auto" : "none",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

    </div>
  );
}
