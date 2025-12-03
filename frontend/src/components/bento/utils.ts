export const DEFAULT_PARTICLE_COUNT = 12;
export const DEFAULT_SPOTLIGHT_RADIUS = 300;
export const DEFAULT_GLOW_COLOR = "132, 0, 255";
export const MOBILE_BREAKPOINT = 768;

export const getStatusIcon = (status: string): string => {
  switch (status) {
    case "planned":
      return "💡";
    case "upcoming":
      return "📅";
    case "happened":
      return "✨";
    default:
      return "💡";
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case "planned":
      return "Idea";
    case "upcoming":
      return "Upcoming Event";
    case "happened":
      return "Memory";
    default:
      return "Idea";
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case "planned":
      return "#fbbf24"; // yellow-400
    case "upcoming":
      return "#3b82f6"; // blue-500
    case "happened":
      return "#a855f7"; // violet-500
    default:
      return "#fbbf24";
  }
};

export const createParticleElement = (
  x: number,
  y: number,
  color: string = DEFAULT_GLOW_COLOR
): HTMLDivElement => {
  const el = document.createElement("div");
  el.className = "particle";
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

export const calculateSpotlightValues = (radius: number) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75,
});

export const updateCardGlowProperties = (
  card: HTMLElement,
  mouseX: number,
  mouseY: number,
  glow: number,
  radius: number
) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty("--glow-x", `${relativeX}%`);
  card.style.setProperty("--glow-y", `${relativeY}%`);
  card.style.setProperty("--glow-intensity", glow.toString());
  card.style.setProperty("--glow-radius", `${radius}px`);
};
