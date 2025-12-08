/**
 * Reusable application header component
 */

import React, { ReactNode } from "react";
import { APP_NAME } from "@/config/constants";

interface AppHeaderProps {
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  searchBar?: ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  leftContent,
  rightContent,
  searchBar,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full px-6 py-4 backdrop-blur-md bg-black/80 border-b border-gray-700 shadow-md">
      <div className="w-full sm:max-w-7xl sm:mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-5">
        <div className="flex items-center justify-between mb-2 sm:mb-0">
          <div className="flex items-center gap-4">
            {leftContent || (
              <>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg text-sm sm:text-base">
                  📋
                </div>
                <h1 className="text-white font-bold text-xl">{APP_NAME}</h1>
              </>
            )}
            {searchBar && (
              <div className="ml-4 hidden sm:block w-64">{searchBar}</div>
            )}
          </div>
          <div className="flex-shrink-0">{rightContent}</div>
        </div>
      </div>
    </header>
  );
};

