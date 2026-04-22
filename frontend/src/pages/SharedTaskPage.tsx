import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  shareService,
  type SharedTask,
  type VoteCounts,
  type TaskComment,
} from "@/services/shareService";
import Header from "@/components/Header";
import { env } from "@/config/env";
import { useAuth } from "@/hooks";

const VOTER_SESSION_KEY = "voter_session";
const VOTED_TOKENS_KEY = "voted_tokens";

function getOrCreateSession(): string {
  let session = localStorage.getItem(VOTER_SESSION_KEY);
  if (!session) {
    session = crypto.randomUUID();
    localStorage.setItem(VOTER_SESSION_KEY, session);
  }
  return session;
}

function getVotedTokens(): Record<string, 1 | 2> {
  try {
    return JSON.parse(localStorage.getItem(VOTED_TOKENS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveVotedToken(token: string, option: 1 | 2) {
  const tokens = getVotedTokens();
  tokens[token] = option;
  localStorage.setItem(VOTED_TOKENS_KEY, JSON.stringify(tokens));
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateShort(dateStr: string | null | undefined) {
  if (!dateStr) return { weekday: "", day: "", month: "", year: "" };
  try {
    const d = new Date(dateStr);
    return {
      weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
      day: d.toLocaleDateString("en-US", { day: "numeric" }),
      month: d.toLocaleDateString("en-US", { month: "short" }),
      year: d.toLocaleDateString("en-US", { year: "numeric" }),
    };
  } catch {
    return { weekday: "", day: dateStr, month: "", year: "" };
  }
}

/* ── Animated percentage bar ── */
function ResultBar({
  label,
  count,
  total,
  isSelected,
  isWinner,
}: {
  label: string;
  count: number;
  total: number;
  isSelected: boolean;
  isWinner: boolean;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className={`rounded-2xl p-4 border transition-all ${isWinner ? "border-violet-400/50 bg-violet-500/10" : "border-white/8 bg-white/[0.03]"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isWinner && <span className="text-sm">✦</span>}
          <span className={`text-sm font-semibold ${isWinner ? "text-white" : "text-white/50"}`}>
            {label}
          </span>
          {isSelected && (
            <span className="text-[10px] border border-violet-400/40 text-violet-300 rounded-full px-2 py-0.5">
              your pick
            </span>
          )}
        </div>
        <span className={`text-2xl font-black tabular-nums ${isWinner ? "text-white" : "text-white/30"}`}>
          {pct}%
        </span>
      </div>

      <div className="h-2 rounded-full bg-white/8 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isWinner
              ? "bg-gradient-to-r from-violet-500 to-fuchsia-400"
              : "bg-white/20"
          }`}
          style={{ width: `${width}%` }}
        />
      </div>

      <p className="text-[11px] text-white/25 mt-2">
        {count} {count === 1 ? "response" : "responses"}
      </p>
    </div>
  );
}

/* ── Sliding switch ── */
function DateSwitch({
  date1,
  date2,
  selected,
  onSelect,
  isVoting,
}: {
  date1: string;
  date2: string;
  selected: 1 | 2 | null;
  onSelect: (v: 1 | 2) => void;
  isVoting: boolean;
}) {
  const d1 = formatDateShort(date1);
  const d2 = formatDateShort(date2);
  const locked = selected !== null;

  return (
    <div className="space-y-3">
      <div
        className="relative bg-white/[0.06] border border-white/10 rounded-2xl p-1.5 flex select-none"
        style={{ cursor: locked ? "default" : "pointer" }}
      >
        <div
          className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 transition-all duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${selected === 2 ? "translate-x-[calc(100%+6px)]" : "translate-x-0"} ${selected === null ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
        />
        {([1, 2] as const).map((opt, i) => {
          const d = i === 0 ? d1 : d2;
          return (
            <>
              {i === 1 && (
                <div key="divider" className="relative z-10 flex items-center flex-shrink-0 px-1">
                  <span className="text-[9px] font-black text-white/15 tracking-widest">OR</span>
                </div>
              )}
              <button
                key={opt}
                onClick={() => !locked && !isVoting && onSelect(opt)}
                disabled={isVoting}
                className="relative z-10 flex-1 py-4 px-3 rounded-xl text-center transition-colors duration-200 disabled:cursor-not-allowed"
                style={{ cursor: locked ? "default" : "pointer" }}
              >
                <div className={`text-[10px] uppercase tracking-[0.18em] font-semibold mb-1 transition-colors duration-200 ${selected === opt ? "text-violet-200" : "text-white/30"}`}>{d.weekday}</div>
                <div className={`text-3xl font-black leading-none transition-colors duration-200 ${selected === opt ? "text-white" : "text-white/40"}`}>
                  {isVoting && selected === opt ? <span className="inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : d.day}
                </div>
                <div className={`text-xs font-medium mt-1 transition-colors duration-200 ${selected === opt ? "text-fuchsia-200" : "text-white/25"}`}>{d.month} {d.year}</div>
              </button>
            </>
          );
        })}
      </div>
      {selected === null && !isVoting && (
        <p className="text-center text-white/20 text-xs">Tap a date to cast your vote</p>
      )}
    </div>
  );
}

/* ── Page ── */
export default function SharedTaskPage() {
  const { loginWithRedirect, user: authUser, isAuthenticated: isLoggedIn } = useAuth0();
  const { token: authToken } = useAuth();
  const { token } = useParams<{ token: string }>();
  const [ownUsername, setOwnUsername] = useState<string | null>(() => localStorage.getItem("gobento_username"));
  const [ownAvatarUrl, setOwnAvatarUrl] = useState<string | null>(null);
  const [task, setTask] = useState<SharedTask | null>(null);
  const [votes, setVotes] = useState<VoteCounts | null>(null);
  const [selected, setSelected] = useState<1 | 2 | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imgExpanded, setImgExpanded] = useState(false);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentName, setCommentName] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [showCommentEmoji, setShowCommentEmoji] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Fetch own profile for updated username + avatar in header
  useEffect(() => {
    if (!authToken) return;
    fetch(`${env.API_URL}/users`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.username) {
          setOwnUsername(data.username);
          localStorage.setItem("gobento_username", data.username);
        }
        setOwnAvatarUrl(data.avatar_url || data.avatarUrl || null);
      })
      .catch(() => {});
  }, [authToken]);

  useEffect(() => {
    if (!token) return;

    const voted = getVotedTokens();
    if (voted[token]) {
      setSelected(voted[token]);
      setHasVoted(true);
    }

    Promise.all([
      shareService.getSharedTask(token),
      shareService.getComments(token).catch(() => ({ comments: [] as TaskComment[] })),
    ])
      .then(([{ task, votes }, { comments }]) => {
        setTask(task);
        setVotes(votes);
        setComments(comments);
      })
      .catch(() => setError("This link is invalid or has expired."))
      .finally(() => setIsLoading(false));
  }, [token]);

  const handleSelect = async (option: 1 | 2) => {
    if (!token || isVoting || hasVoted) return;
    setSelected(option);
    setIsVoting(true);
    try {
      const voterSession = getOrCreateSession();
      const result = await shareService.submitVote(token, option, voterSession);
      setVotes(result.votes);
      setHasVoted(true);
      saveVotedToken(token, option);
    } catch {
      setError("Failed to submit. Please try again.");
      setSelected(null);
    } finally {
      setIsVoting(false);
    }
  };

  // Pre-fill name from Auth0 if logged in
  useEffect(() => {
    if (isLoggedIn && authUser) {
      const name = authUser.nickname || authUser.name || authUser.email || "";
      setCommentName(name);
    }
  }, [isLoggedIn, authUser]);

  const handleComment = async () => {
    if (!token || !commentText.trim() || isPostingComment) return;
    setIsPostingComment(true);
    setCommentError("");
    try {
      const voterSession = getOrCreateSession();
      const { comments: updated } = await shareService.postComment(
        token,
        voterSession,
        commentText.trim(),
        commentName.trim() || undefined
      );
      setComments(updated);
      setCommentText("");
      setShowCommentEmoji(false);
    } catch {
      setCommentError("Failed to post comment. Please try again.");
    } finally {
      setIsPostingComment(false);
    }
  };

  const winner: 1 | 2 | null =
    votes && votes.total > 0 ? (votes[1] >= votes[2] ? 1 : 2) : null;

  const isOwner = isLoggedIn && !!authUser?.sub && authUser.sub === task?.userId;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .fade-up   { animation: fadeUp 0.5s ease both; }
        .fade-up-1 { animation: fadeUp 0.5s 0.08s ease both; }
        .fade-up-2 { animation: fadeUp 0.5s 0.16s ease both; }
        .fade-up-3 { animation: fadeUp 0.5s 0.26s ease both; }
        .border-white\\/8 { border-color: rgba(255,255,255,0.08); }
        .bg-white\\/8  { background-color: rgba(255,255,255,0.08); }
      `}</style>

      {/* Header — mismo que página principal */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/80 border-b border-gray-700 shadow-md">
        <div className="flex items-center justify-between w-full px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <Link to="/" className="no-underline">
              <h1 className="text-white font-bold text-lg sm:text-xl hover:opacity-80 transition-opacity">Gobento</h1>
            </Link>
          </div>
          <div className="flex-shrink-0">
            <Header
              token={authToken}
              API_URL={env.API_URL}
              showConnections={false}
              initialDisplayName={ownUsername}
              avatarUrl={ownAvatarUrl}
            />
          </div>
        </div>
      </header>
      {/* Spacer for fixed header — 64px covers single-row header on all breakpoints */}
      <div aria-hidden="true" style={{ height: 64 }} />

      <div className="relative min-h-screen flex flex-col items-center justify-start px-4 pt-10 pb-16">

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center gap-3 mt-28">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white/30 text-sm">Loading event…</p>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && !task && (
          <div className="mt-28 max-w-sm w-full text-center bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="text-3xl mb-3">🔗</div>
            <p className="text-white font-semibold mb-1">Link not found</p>
            <p className="text-white/40 text-sm">{error}</p>
          </div>
        )}

        {task && !isLoading && (
          <div className="w-full max-w-3xl space-y-4">

            {/* Card: image left (full height), all content right */}
            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl fade-up-1 sm:flex">

              {/* Image — left column, full card height */}
              {task.imageUrl && (
                <div
                  className="sm:w-[42%] flex-shrink-0 cursor-zoom-in overflow-hidden"
                  onClick={() => setImgExpanded(true)}
                >
                  <img
                    src={task.imageUrl}
                    alt={task.title || "Event"}
                    className="w-full h-56 sm:h-full object-cover"
                    style={{ minHeight: "260px" }}
                  />
                </div>
              )}

              {/* Right column: everything */}
              <div className="flex-1 flex flex-col overflow-hidden">

                {/* Event info */}
                <div className="px-6 pt-6 pb-5 border-b border-white/[0.06]">
                  <div className="inline-flex items-center gap-1.5 bg-violet-500/10 border border-violet-400/20 rounded-full px-3 py-1 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-[11px] text-violet-300 font-medium tracking-wide">Event</span>
                  </div>

                  {task.title && (
                    <h1 className="text-xl font-bold text-white leading-snug mb-3">{task.title}</h1>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    {task.dueDate && (
                      <div className="flex items-center gap-1.5 text-xs text-white/40 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {formatDate(task.dueDate)}
                      </div>
                    )}
                    {task.address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-white/40 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:text-violet-300 hover:border-violet-400/30 transition-colors no-underline"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {task.address}
                      </a>
                    )}
                  </div>

                  {task.text && task.text !== task.title && (
                    <p className="text-white/55 text-sm leading-relaxed">{task.text}</p>
                  )}
                </div>

                {/* Poll */}
                {(task.dateOption1 || task.dateOption2) && (
                  <div className="px-6 py-5 border-b border-white/[0.06] fade-up-2">
                    {isOwner ? (
                      /* Owner: read-only results */
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-bold text-base">Poll results</p>
                          <span className="text-[10px] text-violet-300 border border-violet-400/30 rounded-full px-2 py-0.5">your event</span>
                        </div>
                        {votes && votes.total > 0 ? (
                          <>
                            {([1, 2] as const).map((opt) => {
                              const dateStr = opt === 1 ? task.dateOption1 : task.dateOption2;
                              if (!dateStr) return null;
                              const parsed = formatDateShort(dateStr);
                              return (
                                <ResultBar
                                  key={opt}
                                  label={`${parsed.weekday}, ${parsed.month} ${parsed.day}`}
                                  count={votes[opt]}
                                  total={votes.total}
                                  isSelected={false}
                                  isWinner={winner === opt}
                                />
                              );
                            })}
                            <p className="text-center text-white/20 text-xs">
                              {votes.total} {votes.total === 1 ? "person" : "people"} responded
                            </p>
                          </>
                        ) : (
                          <p className="text-white/30 text-xs mt-2">No votes yet</p>
                        )}
                      </div>
                    ) : !hasVoted ? (
                      /* Guest / non-owner: voting UI */
                      <>
                        <p className="text-white font-bold text-base mb-1">When works for you?</p>
                        <p className="text-white/30 text-xs mb-4">Tap a date — your vote is final</p>
                        <DateSwitch
                          date1={task.dateOption1 ?? ""}
                          date2={task.dateOption2 ?? ""}
                          selected={selected}
                          onSelect={handleSelect}
                          isVoting={isVoting}
                        />
                        {error && <p className="text-red-400 text-xs text-center mt-3">{error}</p>}
                      </>
                    ) : (
                      /* After voting: show results */
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-400"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                          <p className="text-white text-xs font-semibold">Response recorded! Here's the poll so far</p>
                        </div>
                        {votes && ([1, 2] as const).map((opt) => {
                          const dateStr = opt === 1 ? task.dateOption1 : task.dateOption2;
                          if (!dateStr) return null;
                          const parsed = formatDateShort(dateStr);
                          return (
                            <ResultBar
                              key={opt}
                              label={`${parsed.weekday}, ${parsed.month} ${parsed.day}`}
                              count={votes[opt]}
                              total={votes.total}
                              isSelected={selected === opt}
                              isWinner={winner === opt}
                            />
                          );
                        })}
                        {votes && (
                          <p className="text-center text-white/20 text-xs">
                            {votes.total} {votes.total === 1 ? "person" : "people"} responded
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Comments */}
                <div className="px-6 py-5 flex-1">
                    <p className="text-[11px] text-white/40 uppercase tracking-widest font-semibold mb-3">
                      Comments {comments.length > 0 && <span className="text-violet-400">· {comments.length}</span>}
                    </p>

                    {comments.length > 0 && (
                      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
                        {comments.map((c) => (
                          <div key={c.id} className="flex gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-2xl px-3 py-2">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-semibold text-white/80">{c.name}</span>
                                <span className="text-[10px] text-white/20">
                                  {new Date(c.createdAt.replace(" ", "T")).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                              </div>
                              <p className="text-sm text-white/60 leading-relaxed">{c.comment}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {comments.length === 0 && (
                      <p className="text-white/20 text-xs mb-4">Be the first to comment</p>
                    )}

                    {/* Comment form */}
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={commentName}
                        onChange={(e) => setCommentName(e.target.value)}
                        placeholder="Your name (optional)"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-400/50"
                      />
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            ref={commentInputRef}
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleComment()}
                            placeholder="Leave a comment…"
                            maxLength={500}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-9 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-400/50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCommentEmoji((v) => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-base opacity-50 hover:opacity-100 transition-opacity"
                            title="Add emoji"
                          >
                            😊
                          </button>
                          {showCommentEmoji && (
                            <div className="absolute bottom-full mb-2 left-0 right-0 flex flex-wrap gap-1 p-2 bg-black/95 backdrop-blur-md border-2 border-purple-400 rounded-xl shadow-2xl z-50">
                              {["😊","😂","❤️","🎉","👍","🔥","😍","🙌","✨","🥳","😎","💪","🤩","😭","🫶","🎊","💯","🤣","😅","🙏"].map((e) => (
                                <button
                                  key={e}
                                  type="button"
                                  onMouseDown={(ev) => {
                                    ev.preventDefault();
                                    setCommentText((prev) => prev + e);
                                    commentInputRef.current?.focus();
                                  }}
                                  className="text-xl hover:scale-125 transition-transform"
                                >
                                  {e}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={handleComment}
                          disabled={!commentText.trim() || isPostingComment}
                          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex-shrink-0"
                        >
                          {isPostingComment ? "…" : "Send"}
                        </button>
                      </div>
                      {commentError && <p className="text-red-400 text-xs">{commentError}</p>}
                    </div>
                </div>
              </div>

            </div>

            <div className="text-center fade-up-3 space-y-2 pt-2">
              <p className="text-white/20 text-xs">Shared via Gobento</p>
              <button
                onClick={() => loginWithRedirect()}
                className="inline-flex items-center gap-1.5 text-xs text-violet-400/70 hover:text-violet-300 transition-colors bg-transparent border-none cursor-pointer"
              >
                Create your own events
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {imgExpanded && task?.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setImgExpanded(false)}
        >
          <img
            src={task.imageUrl}
            alt={task?.title || ""}
            className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
