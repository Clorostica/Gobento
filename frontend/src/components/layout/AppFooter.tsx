import React from "react";

export const AppFooter: React.FC = () => {
  return (
    <footer className="w-full py-4 text-center text-sm border-t border-gray-200/50 backdrop-blur-sm bg-white/20 z-50 mt-auto">
      <p className="flex items-center justify-center gap-1">
        Created with <span className="text-pink-500 animate-pulse">♥</span> by
        <a
          href="https://github.com/Clorostica"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-pink-500 no-underline visited:text-pink-500 transition hover:text-pink-400 hover:drop-shadow-[0_0_8px_#ec4899] ml-1"
        >
          Clorostica
        </a>
      </p>
    </footer>
  );
};
