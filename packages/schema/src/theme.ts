import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "must be a hex color like #1a1a1a");

/**
 * Design tokens. Swapping a theme should never touch slide content —
 * that separation is the whole point of keeping this out of the slide schema.
 */
export const ThemeSchema = z.object({
  name: z.string(),
  colors: z.object({
    background: hexColor,
    text: hexColor,
    accent: hexColor,
    muted: hexColor,
  }),
  fonts: z.object({
    heading: z.string(),
    body: z.string(),
  }),
});

export type Theme = z.infer<typeof ThemeSchema>;

/**
 * Fixed catalog of hand-designed themes — same principle as the slide
 * layout catalog: the user (or model) picks from options that already
 * look good, nothing invents raw hex values at request time.
 */
export const THEMES = {
  classic: {
    name: "Classic",
    colors: { background: "#ffffff", text: "#111111", accent: "#4f46e5", muted: "#6b7280" },
    fonts: { heading: "Poppins", body: "Inter" },
  },
  midnight: {
    name: "Midnight",
    colors: { background: "#0f1115", text: "#f5f5f7", accent: "#818cf8", muted: "#9ca3af" },
    fonts: { heading: "Poppins", body: "Inter" },
  },
  sunset: {
    name: "Sunset",
    colors: { background: "#fff8f0", text: "#2a1a12", accent: "#ea580c", muted: "#a8785a" },
    fonts: { heading: "Playfair Display", body: "Inter" },
  },
  mono: {
    name: "Mono",
    colors: { background: "#fafafa", text: "#18181b", accent: "#18181b", muted: "#71717a" },
    fonts: { heading: "Inter", body: "Inter" },
  },
} as const satisfies Record<string, Theme>;

export type ThemeId = keyof typeof THEMES;

export const THEME_IDS = Object.keys(THEMES) as [ThemeId, ...ThemeId[]];

export const ThemeIdSchema = z.enum(THEME_IDS);

export const DEFAULT_THEME_ID: ThemeId = "classic";

export const DEFAULT_THEME: Theme = THEMES[DEFAULT_THEME_ID];
