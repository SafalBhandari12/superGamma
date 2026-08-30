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

export const DEFAULT_THEME: Theme = {
  name: "default",
  colors: {
    background: "#ffffff",
    text: "#111111",
    accent: "#4f46e5",
    muted: "#6b7280",
  },
  fonts: {
    heading: "Inter",
    body: "Inter",
  },
};
