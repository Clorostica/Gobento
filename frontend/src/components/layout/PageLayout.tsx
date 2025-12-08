/**
 * Reusable page layout component with background effect
 */

import React, { ReactNode } from "react";
import PixelBlast from "../PixelBlast";
import { PIXEL_BLAST_CONFIG } from "@/config/constants";
import "../pixelblast.css";

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
      {/* Background Layer */}
      <div
        className="fixed top-0 left-0 w-screen h-screen z-0"
        aria-hidden="true"
      >
        <PixelBlast
          {...PIXEL_BLAST_CONFIG}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {header && <header>{header}</header>}
        <main className="flex-grow">{children}</main>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
};
