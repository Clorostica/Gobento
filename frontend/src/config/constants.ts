export const APP_NAME = "EventSync";

export const EVENT_STATUS = {
  PLANNED: "planned",
  UPCOMING: "upcoming",
  HAPPENED: "happened",
} as const;

export const EVENT_FILTER = {
  ALL: "all",
  PLANNED: "planned",
  UPCOMING: "upcoming",
  HAPPENED: "happened",
  LIKED: "liked",
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];
export type EventFilter = (typeof EVENT_FILTER)[keyof typeof EVENT_FILTER];

export const COLOR_CLASSES = [
  "bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200 hover:border-gray-300 shadow-sm",
  "bg-gradient-to-br from-blue-50/80 to-blue-100/40 border-blue-200/60 hover:border-blue-300 shadow-sm",
  "bg-gradient-to-br from-purple-50/80 to-purple-100/40 border-purple-200/60 hover:border-purple-300 shadow-sm",
  "bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 border-emerald-200/60 hover:border-emerald-300 shadow-sm",
  "bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200 hover:border-slate-300 shadow-sm",
  "bg-gradient-to-br from-indigo-50/80 to-indigo-100/40 border-indigo-200/60 hover:border-indigo-300 shadow-sm",
  "bg-gradient-to-br from-cyan-50/80 to-cyan-100/40 border-cyan-200/60 hover:border-cyan-300 shadow-sm",
  "bg-gradient-to-br from-violet-50/80 to-violet-100/40 border-violet-200/60 hover:border-violet-300 shadow-sm",
] as const;

export const PIXEL_BLAST_CONFIG = {
  variant: "circle" as const,
  pixelSize: 6,
  color: "#B19EEF",
  patternScale: 3,
  patternDensity: 0.8,
  pixelSizeJitter: 0.5,
  enableRipples: true,
  rippleSpeed: 0.4,
  rippleThickness: 0.12,
  rippleIntensityScale: 1.5,
  liquid: true,
  liquidStrength: 0.12,
  liquidRadius: 1.2,
  liquidWobbleSpeed: 5,
  speed: 0.6,
  edgeFade: 0.25,
  transparent: false,
} as const;

export const STORAGE_KEYS = {
  NO_USER_EVENTS: "events:nouser",
} as const;

export const NOTIFICATION_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
