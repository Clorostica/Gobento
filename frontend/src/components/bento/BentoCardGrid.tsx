import React from "react";

interface BentoCardGridProps {
  children: React.ReactNode;
  gridRef?: React.RefObject<HTMLDivElement | null>;
}

const BentoCardGrid: React.FC<BentoCardGridProps> = ({ children, gridRef }) => (
  <div className="card-grid bento-section" ref={gridRef}>
    {children}
  </div>
);

export default BentoCardGrid;
