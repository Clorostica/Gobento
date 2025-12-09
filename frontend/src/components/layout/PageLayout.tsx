/**
 * Reusable page layout component
 */

import React, { type ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  header,
  footer,
  className = "",
}) => {
  return (
    <div className={className}>
      {/* Content Layer */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {header && <header>{header}</header>}
        <main className="flex-grow">{children}</main>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
};
