import React, { useState, useEffect, useCallback, useRef } from "react";
import NotificationPanel, { type Notification } from "./NotificationPanel";
import StarBorder from "./StarBorder";
import Tooltip from "./Tooltip";

interface NotificationBellProps {
  token: string | null;
  API_URL: string;
}

const POLL_INTERVAL = 30_000; // 30 seconds

const NotificationBell = ({ token, API_URL }: NotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent fail — don't disrupt the UI
    }
  }, [token, API_URL]);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close when clicking outside the entire bell+panel wrapper
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = useCallback(async () => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
      setUnreadCount(0);
    } catch {
      // silent fail
    }
  }, [token, API_URL]);

  // When panel opens, mark all as read after a short delay
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      const timer = setTimeout(() => {
        handleMarkAllRead();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, unreadCount, handleMarkAllRead]);

  if (!token) return null;

  return (
    <div ref={bellRef} className="relative">
      <Tooltip label={unreadCount > 0 ? `${unreadCount} new notification${unreadCount > 1 ? "s" : ""}` : "Notifications"} position="bottom">
      <StarBorder
        onClick={handleOpen}
        className="flex items-center gap-1.5 font-semibold shadow-lg transition-colors duration-300 text-sm px-3 py-2 min-h-[38px] star-border-container cursor-pointer"
        color={unreadCount > 0 ? "#c084fc" : "#B19EEF"}
        speed="6s"
        thickness={2}
        aria-label="Notifications"
      >
        {/* Bell icon */}
        <span className="relative flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-4 h-4 sm:w-5 sm:h-5 ${unreadCount > 0 ? "text-purple-300" : "text-white"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-purple-600 text-white text-[9px] font-bold leading-none ring-1 ring-black">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </span>

      </StarBorder>
      </Tooltip>

      <NotificationPanel
        notifications={notifications}
        unreadCount={unreadCount}
        isOpen={isOpen}
        onClose={handleClose}
        onMarkAllRead={handleMarkAllRead}
        token={token}
        API_URL={API_URL}
      />
    </div>
  );
};

export default NotificationBell;
