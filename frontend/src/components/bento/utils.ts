// bento/utils.ts

export const DEFAULT_PARTICLE_COUNT = 12;
export const DEFAULT_SPOTLIGHT_RADIUS = 300;
export const DEFAULT_GLOW_COLOR = "132, 0, 255";
export const MOBILE_BREAKPOINT = 599;

// Modern color scheme with gradients
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "planned":
      // Purple gradient (idea/planning phase) - usando el color del MagicBento
      return "linear-gradient(135deg, rgba(132, 0, 255, 0.15) 0%, rgba(88, 0, 170, 0.15) 100%)";
    case "upcoming":
      // Blue gradient (upcoming events)
      return "linear-gradient(135deg, rgba(0, 150, 255, 0.15) 0%, rgba(0, 100, 200, 0.15) 100%)";
    case "happened":
      // Green gradient (completed events)
      return "linear-gradient(135deg, rgba(0, 200, 150, 0.15) 0%, rgba(0, 150, 100, 0.15) 100%)";
    default:
      return "linear-gradient(135deg, rgba(100, 100, 100, 0.15) 0%, rgba(60, 60, 60, 0.15) 100%)";
  }
};

// Border colors for modern look
export const getStatusBorderColor = (status: string): string => {
  switch (status) {
    case "planned":
      return "rgba(132, 0, 255, 0.4)";
    case "upcoming":
      return "rgba(0, 150, 255, 0.4)";
    case "happened":
      return "rgba(0, 200, 150, 0.4)";
    default:
      return "rgba(100, 100, 100, 0.4)";
  }
};

// Modern labels with emojis
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case "planned":
      return "💡 Idea";
    case "upcoming":
      return "📅 Próximo";
    case "happened":
      return "✅ Realizado";
    default:
      return status;
  }
};

// Icon for status (if needed separately)
export const getStatusIcon = (status: string): string => {
  switch (status) {
    case "planned":
      return "💡";
    case "upcoming":
      return "📅";
    case "happened":
      return "✅";
    default:
      return "📌";
  }
};

// Shadow effect for cards based on status
export const getStatusShadow = (status: string): string => {
  switch (status) {
    case "planned":
      return "0 8px 32px rgba(132, 0, 255, 0.15)";
    case "upcoming":
      return "0 8px 32px rgba(0, 150, 255, 0.15)";
    case "happened":
      return "0 8px 32px rgba(0, 200, 150, 0.15)";
    default:
      return "0 8px 32px rgba(100, 100, 100, 0.15)";
  }
};

// Create particle element for ParticleCard
export const createParticleElement = (glowColor: string): HTMLDivElement => {
  const particle = document.createElement("div");
  particle.className = "magic-bento-particle";
  particle.style.setProperty("--particle-glow-color", glowColor);
  return particle;
};

// Calculate spotlight values for proximity and fade distance
export const calculateSpotlightValues = (
  spotlightRadius: number
): { proximity: number; fadeDistance: number } => {
  const proximity = spotlightRadius * 0.3;
  const fadeDistance = spotlightRadius * 1.2;
  return { proximity, fadeDistance };
};

// Update card glow properties based on mouse position
export const updateCardGlowProperties = (
  cardElement: HTMLElement,
  mouseX: number,
  mouseY: number,
  glowIntensity: number,
  spotlightRadius: number
): void => {
  const cardRect = cardElement.getBoundingClientRect();
  const cardCenterX = cardRect.left + cardRect.width / 2;
  const cardCenterY = cardRect.top + cardRect.height / 2;

  // Calculate relative position of mouse to card center
  const relativeX = mouseX - cardCenterX;
  const relativeY = mouseY - cardCenterY;

  // Convert to percentage for CSS custom properties
  const glowX = 50 + (relativeX / cardRect.width) * 50;
  const glowY = 50 + (relativeY / cardRect.height) * 50;

  // Update CSS custom properties
  cardElement.style.setProperty("--glow-x", `${glowX}%`);
  cardElement.style.setProperty("--glow-y", `${glowY}%`);
  cardElement.style.setProperty("--glow-intensity", String(glowIntensity));
  cardElement.style.setProperty("--glow-radius", `${spotlightRadius}px`);
};
