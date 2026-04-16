import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import type { Task } from "@/types/tasks/task.types";
import { DEFAULT_GLOW_COLOR } from "./utils";

interface TaskCardWithoutStarsProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  task: Task;
  shouldDisableAnimations?: boolean;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  glowColor?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
}

const TaskCardWithoutStars: React.FC<TaskCardWithoutStarsProps> = ({
  children,
  className = "",
  style,
  task,
  shouldDisableAnimations = false,
  enableTilt = false,
  enableMagnetism = false,
  clickEffect = false,
  glowColor = DEFAULT_GLOW_COLOR,
  draggable,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldDisableAnimations || !cardRef.current) return;

    const el = cardRef.current;

    const clamp = (val: number, max: number) => Math.max(-max, Math.min(max, val));

    el.style.zIndex = "1";

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableTilt && !enableMagnetism) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const normX = (x - centerX) / centerX;
      const normY = (y - centerY) / centerY;

      const rotateX = enableTilt ? normY * -8 : 0;
      const rotateY = enableTilt ? normX * 8 : 0;
      const magnetX = enableMagnetism ? clamp(normX * centerX * 0.06, 6) : 0;
      const magnetY = enableMagnetism ? clamp(normY * centerY * 0.06, 6) : 0;

      gsap.to(el, {
        rotateX,
        rotateY,
        x: magnetX,
        y: magnetY,
        duration: 0.15,
        ease: "power2.out",
        transformPerspective: 1000,
      });
    };

    const handleMouseEnter = () => {
      el.style.zIndex = "10";
    };

    const handleMouseLeave = () => {
      if (shouldDisableAnimations) return;

      // Spring return to exact original position
      gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.5)",
        transformPerspective: 1000,
        onComplete: () => {
          el.style.zIndex = "1";
        },
      });
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickEffect || shouldDisableAnimations) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement("div");
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 1000;
      `;

      el.appendChild(ripple);

      gsap.fromTo(
        ripple,
        {
          scale: 0,
          opacity: 1,
        },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          onComplete: () => ripple.remove(),
        }
      );
    };

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("click", handleClick);

    return () => {
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("click", handleClick);
    };
  }, [
    shouldDisableAnimations,
    enableTilt,
    enableMagnetism,
    clickEffect,
    glowColor,
  ]);

  return (
    <div
      ref={cardRef}
      className={className}
      style={style}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}
    </div>
  );
};

export default TaskCardWithoutStars;
