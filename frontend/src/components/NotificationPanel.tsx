import type React from "react";
import { useNavigate } from "react-router-dom";

export interface Notification {
  id: number;
  actor_id: string | null;
  actor_name: string | null;
  type: "follow" | "vote" | "comment" | "share";
  event_id: string | null;
  event_title: string | null;
  read: number;
  created_at: string;
}

interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
  token: string | null;
  API_URL: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function notifMessage(n: Notification): string {
  const actor = n.actor_name ? `@${n.actor_name}` : "Someone";
  const title = n.event_title ? `"${n.event_title}"` : "your event";
  switch (n.type) {
    case "follow":
      return `${actor} started following you`;
    case "vote":
      return `${actor} voted on ${title}`;
    case "comment":
      return `${actor} commented on ${title}`;
    case "share":
      return `${actor} shared ${title} on their profile`;
    default:
      return "New notification";
  }
}

function notifIcon(type: string): string {
  switch (type) {
    case "follow": return "👤";
    case "vote": return "🗳️";
    case "comment": return "💬";
    case "share": return "🔖";
    default: return "🔔";
  }
}

const NotificationPanel = ({
  notifications,
  unreadCount,
  isOpen,
  onClose,
  onMarkAllRead,
}: NotificationPanelProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNotifClick = (n: Notification) => {
    if (n.type === "share" && n.actor_id) {
      onClose();
      navigate(`/user/${n.actor_id}`);
    } else if (n.type === "follow" && n.actor_id) {
      onClose();
      navigate(`/user/${n.actor_id}`);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 rounded-xl overflow-hidden z-50" style={{ background: "rgba(5,0,20,0.97)", border: "1px solid rgba(139,92,246,0.25)", boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)", backdropFilter: "blur(16px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(139,92,246,0.15)" }}>
        <span className="text-white font-semibold text-sm">Notifications</span>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => {
            const isClickable = (n.type === "share" || n.type === "follow") && !!n.actor_id;
            return (
              <div
                key={n.id}
                onClick={() => handleNotifClick(n)}
                className={`flex items-start gap-3 px-4 py-3 border-b last:border-b-0 transition-colors ${
                  n.read ? "opacity-50" : "bg-purple-500/[0.06]"
                } ${isClickable ? "cursor-pointer hover:bg-white/[0.05]" : ""}`}
                style={{ borderColor: "rgba(139,92,246,0.08)" }}
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{notifIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white leading-snug">
                    {notifMessage(n)}
                  </p>
                  {isClickable && (
                    <p className="text-xs text-purple-400 mt-0.5">
                      {n.type === "share" ? "View their profile →" : "View profile →"}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1.5" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
