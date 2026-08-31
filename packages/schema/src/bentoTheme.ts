import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "must be a hex color like #1a1a1a");

/**
 * A bento theme is a complete token set, not an accent colour.
 *
 * The distinction that matters: `tones` are DECORATIVE tile fills, `series`
 * are DATA colours, and they are deliberately different sets. The tones are
 * chosen to look good as large flat panels; run them through a colour-vision
 * validator as chart series and they fail — e.g. Paper's olive/teal pair sits
 * at ΔE 11.7 for normal vision (below the 15 floor) and Obsidian's violet/blue
 * at ΔE 3.1 for deuteranopia. So charts never borrow tile colours; they use
 * `series`, which is validated for all-pairs CVD separation in both modes.
 */
export const BentoThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  mode: z.enum(["dark", "light"]),
  colors: z.object({
    /** slide background */
    canvas: hexColor,
    /** three tile surface tiers — elevation comes from lightness, not shadow */
    surface1: hexColor,
    surface2: hexColor,
    surface3: hexColor,
    border: z.string(),
    text: hexColor,
    muted: hexColor,
    /** five decorative tile fills */
    tones: z.tuple([hexColor, hexColor, hexColor, hexColor, hexColor]),
    /** text colour that sits on a tone-filled tile */
    onTone: hexColor,
    /** validated categorical data colours — never the tones */
    series: z.tuple([hexColor, hexColor, hexColor]),
    /** semantic pair for diverging / delta encodings */
    positive: hexColor,
    negative: hexColor,
    ghost: z.string(),
  }),
  /** which tone indices the mesh gradient blends, lightest node first */
  meshTones: z.tuple([z.number().int(), z.number().int(), z.number().int()]),
});

export type BentoTheme = z.infer<typeof BentoThemeSchema>;

/** Light-surface series palette. Passes all-pairs CVD + normal-vision floors. */
const SERIES_LIGHT = ["#2a78d6", "#eb6834", "#1baf7a"] as const;
/** Dark-surface steps of the same three hues, validated against a dark surface. */
const SERIES_DARK = ["#3987e5", "#d95926", "#199e70"] as const;

export const BENTO_THEMES = {
  paper: {
    id: "paper",
    name: "Paper",
    mode: "light",
    colors: {
      canvas: "#EDE8DE",
      surface1: "#FFFFFF",
      surface2: "#FAF6EE",
      surface3: "#F3EDE1",
      border: "rgba(31,27,22,0.11)",
      text: "#1F1B16",
      muted: "#6E6558",
      tones: ["#C2410C", "#CA8A04", "#4D7C0F", "#0F766E", "#9D174D"],
      onTone: "#FFF8F0",
      series: [...SERIES_LIGHT],
      positive: "#1baf7a",
      negative: "#eb6834",
      ghost: "rgba(31,27,22,0.06)",
    },
    meshTones: [0, 1, 4],
  },
  obsidian: {
    id: "obsidian",
    name: "Obsidian",
    mode: "dark",
    colors: {
      canvas: "#08080A",
      surface1: "#131316",
      surface2: "#1A1A1E",
      surface3: "#212127",
      border: "rgba(255,255,255,0.08)",
      text: "#F5F5F7",
      muted: "#8E8E93",
      tones: ["#FF6B4A", "#FFB03A", "#4ADE80", "#4DA3FF", "#C084FC"],
      onTone: "#0B0A0C",
      series: [...SERIES_DARK],
      positive: "#199e70",
      negative: "#d95926",
      ghost: "rgba(255,255,255,0.05)",
    },
    meshTones: [0, 4, 3],
  },
  graphite: {
    id: "graphite",
    name: "Graphite",
    mode: "dark",
    colors: {
      canvas: "#0A0D12",
      surface1: "#11151C",
      surface2: "#171C24",
      surface3: "#1D232D",
      border: "rgba(255,255,255,0.07)",
      text: "#E9EEF6",
      muted: "#8695A8",
      tones: ["#4DA3FF", "#38BDF8", "#34D399", "#FBBF24", "#F472B6"],
      onTone: "#05090F",
      series: [...SERIES_DARK],
      positive: "#199e70",
      negative: "#d95926",
      ghost: "rgba(255,255,255,0.045)",
    },
    meshTones: [0, 1, 4],
  },
  verdant: {
    id: "verdant",
    name: "Verdant",
    mode: "dark",
    colors: {
      canvas: "#06110C",
      surface1: "#0E1A14",
      surface2: "#13221A",
      surface3: "#1A2C21",
      border: "rgba(255,255,255,0.07)",
      text: "#E8F5EC",
      muted: "#7E9A88",
      tones: ["#4ADE80", "#A3E635", "#22D3EE", "#FACC15", "#FB923C"],
      onTone: "#04120A",
      series: [...SERIES_DARK],
      positive: "#199e70",
      negative: "#d95926",
      ghost: "rgba(255,255,255,0.045)",
    },
    meshTones: [0, 2, 1],
  },
  frost: {
    id: "frost",
    name: "Frost",
    mode: "light",
    colors: {
      canvas: "#E7ECF2",
      surface1: "#FFFFFF",
      surface2: "#F6F9FC",
      surface3: "#E9EFF6",
      border: "rgba(15,23,42,0.10)",
      text: "#0F172A",
      muted: "#64748B",
      tones: ["#0F766E", "#1D4ED8", "#B45309", "#BE185D", "#4D7C0F"],
      onTone: "#F8FBFF",
      series: [...SERIES_LIGHT],
      positive: "#1baf7a",
      negative: "#eb6834",
      ghost: "rgba(15,23,42,0.05)",
    },
    meshTones: [0, 1, 3],
  },
} as const satisfies Record<string, BentoTheme>;

export type BentoThemeId = keyof typeof BENTO_THEMES;

export const BENTO_THEME_IDS = Object.keys(BENTO_THEMES) as [BentoThemeId, ...BentoThemeId[]];

export const BentoThemeIdSchema = z.enum(BENTO_THEME_IDS);

export const DEFAULT_BENTO_THEME_ID: BentoThemeId = "paper";
