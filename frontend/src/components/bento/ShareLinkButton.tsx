import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Task } from "@/types/tasks/task.types";
import { env } from "@/config/env";

interface VoteCounts {
  1: number;
  2: number;
  total: number;
}

interface Comment {
  id: string;
  name: string;
  comment: string;
  createdAt: string;
}

interface ShareLinkButtonProps {
  task: Task;
  onShare: (
    taskId: string,
    dateOption1: string,
    dateOption2: string
  ) => Promise<string>; // returns token
  onGetVotes: (taskId: string) => Promise<VoteCounts>;
}

function formatDate(iso: string): string {
  if (!iso) return iso;
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

const ShareLinkButton: React.FC<ShareLinkButtonProps> = ({
  task,
  onShare,
  onGetVotes,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateOption1, setDateOption1] = useState(task.dateOption1 || "");
  const [dateOption2, setDateOption2] = useState(task.dateOption2 || "");
  const [token, setToken] = useState(task.shareToken || "");
  const [votes, setVotes] = useState<VoteCounts | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const shareUrl = token
    ? `${window.location.origin}/share/${token}`
    : null;

  useEffect(() => {
    if (!isOpen || !task.shareToken) return;
    const t = task.shareToken;
    onGetVotes(task.id).then(setVotes).catch(() => {});
    fetch(`${env.API_URL}/share/${t}/comments`)
      .then((r) => r.json())
      .then((data) => {
        if (data.comments) {
          // convert snake_case keys
          const mapped: Comment[] = data.comments.map((c: any) => ({
            id: c.id,
            name: c.name,
            comment: c.comment,
            createdAt: c.created_at || c.createdAt || "",
          }));
          setComments(mapped);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const openPanel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPanelPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen((prev) => !prev);
  };

  const handleSave = async () => {
    if (!dateOption1 || !dateOption2) {
      setError("Both date options are required");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      const newToken = await onShare(task.id, dateOption1, dateOption2);
      setToken(newToken);
      const v = await onGetVotes(task.id);
      setVotes(v);
    } catch {
      setError("Failed to generate link");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pct = (option: 1 | 2) => {
    if (!votes || votes.total === 0) return 0;
    return Math.round((votes[option] / votes.total) * 100);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={openPanel}
        onMouseDown={(e) => e.stopPropagation()}
        title="Magic link"
        className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${
          token
            ? "text-purple-400 opacity-90 hover:opacity-100"
            : "text-white opacity-40 hover:opacity-80"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>

      {isOpen && createPortal(
        <div
          ref={panelRef}
          style={{ position: "fixed", top: panelPos.top, right: panelPos.right, zIndex: 9999 }}
          className="w-72 bg-black/95 backdrop-blur-md border border-purple-400/30 rounded-xl shadow-2xl p-4"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">
            Magic Link
          </div>

          {/* Date options */}
          <div className="space-y-2 mb-3">
            <div>
              <label className="text-[10px] text-white/50 uppercase tracking-wide">
                Option 1
              </label>
              <input
                type="date"
                value={dateOption1}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDateOption1(e.target.value)}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-400/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/50 uppercase tracking-wide">
                Option 2
              </label>
              <input
                type="date"
                value={dateOption2}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDateOption2(e.target.value)}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-400/50"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs mb-2">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors mb-3"
          >
            {isSaving
              ? "Saving..."
              : token
              ? "Update Link"
              : "Generate Link"}
          </button>

          {/* Share URL */}
          {shareUrl && (
            <div className="mb-3">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <span className="text-xs text-white/60 truncate flex-1">
                  {shareUrl}
                </span>
                <button
                  onClick={handleCopy}
                  className="text-xs text-purple-400 hover:text-purple-300 whitespace-nowrap font-semibold transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}

          {/* Vote stats */}
          {votes && votes.total > 0 && (
            <div className="border-t border-white/10 pt-3">
              <div className="text-[10px] text-white/40 uppercase tracking-wide mb-2">
                {votes.total} {votes.total === 1 ? "response" : "responses"}
              </div>
              {([1, 2] as const).map((opt) => (
                <div key={opt} className="mb-2">
                  <div className="flex justify-between text-xs text-white/70 mb-1">
                    <span>{opt === 1 ? formatDate(dateOption1) : formatDate(dateOption2)}</span>
                    <span className="font-semibold text-white">{pct(opt)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct(opt)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {votes && votes.total === 0 && shareUrl && (
            <p className="text-xs text-white/30 text-center">No responses yet</p>
          )}

          {/* Comments */}
          {comments.length > 0 && (
            <div className="border-t border-white/10 pt-3 mt-3">
              <div className="text-[10px] text-white/40 uppercase tracking-wide mb-2">
                {comments.length} {comments.length === 1 ? "comment" : "comments"}
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 mt-0.5">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-semibold text-white/70">{c.name} </span>
                      <span className="text-[10px] text-white/40">{c.comment}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default ShareLinkButton;
