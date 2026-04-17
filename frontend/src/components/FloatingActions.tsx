import React, { useState, useEffect } from "react";

interface FloatingActionsProps {
  onAddEvent: () => void;
}

const FloatingActions: React.FC<FloatingActionsProps> = ({ onAddEvent }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 320);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-6 right-5 z-[300] flex flex-col items-end gap-3 pointer-events-none">

      {/* Scroll to top */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center
          bg-black/70 border border-purple-500/40 backdrop-blur-md
          text-white/70 hover:text-white hover:border-purple-400
          shadow-lg shadow-purple-900/30
          transition-all duration-300 ease-out
          ${showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      {/* Add Event FAB */}
      <button
        onClick={onAddEvent}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Add new event"
        className="pointer-events-auto group relative flex items-center overflow-hidden
          rounded-full border border-purple-500/60
          shadow-xl shadow-purple-900/40
          transition-all duration-300 ease-out
          active:scale-95"
        style={{
          background: "linear-gradient(135deg, rgba(132,0,255,0.9) 0%, rgba(217,70,239,0.9) 100%)",
          width: hovered ? "148px" : "52px",
          height: "52px",
        }}
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ background: "radial-gradient(circle, rgba(132,0,255,0.6) 0%, transparent 70%)" }}
        />

        {/* Icon */}
        <span className="relative z-10 flex-shrink-0 w-[52px] h-[52px] flex items-center justify-center text-white text-2xl font-light leading-none">
          +
        </span>

        {/* Label — slides in on hover */}
        <span
          className="relative z-10 text-white text-sm font-semibold whitespace-nowrap pr-4 leading-none overflow-hidden transition-all duration-300"
          style={{
            maxWidth: hovered ? "96px" : "0px",
            opacity: hovered ? 1 : 0,
          }}
        >
          Add Event
        </span>
      </button>
    </div>
  );
};

export default FloatingActions;
