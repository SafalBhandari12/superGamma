import type { Config } from "tailwindcss";

/**
 * The product renders decks in five themes; the app itself is dressed in one
 * of them — "Paper". Every colour below is lifted from THEMES.paper in
 * @supergamma/schema, so the marketing site and the dashboard are made of the
 * same tokens the generator paints slides with. Nothing here is a gradient:
 * elevation comes from lightness tiers (canvas → surface → raised) and from
 * flat tone fills, exactly like the bento renderer.
 *
 * TYPE — three faces, three jobs, no overlap:
 *   Fraunces (serif)   display only — h1/h2. Optical sizing does the work at
 *                      scale, so headlines need no extra weight to dominate.
 *   Geist (sans)       everything you read. Also what the slides are set in,
 *                      so page and deck are the same voice.
 *   Geist Mono         labels, eyebrows, figures. Never prose.
 *
 * Sizes are a 1.25 modular scale off a 16px base, in rem so browser zoom and
 * user font-size settings still work. The two display steps are fluid via
 * clamp() rather than breakpoint-swapped.
 */
export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /** page ground — warm, never white */
        canvas: "#EDE8DE",
        /** the three elevation tiers, lightest = most raised */
        surface: "#FFFFFF",
        "surface-2": "#FAF6EE",
        "surface-3": "#F3EDE1",
        /** opaque rules, so borders don't shift value across the tiers */
        line: "#DFD8CA",
        "line-strong": "#C6BCA9",
        ink: "#1F1B16",
        "ink-2": "#453E33",
        /** 5.8:1 on surface — safe for body copy */
        muted: "#6E6558",
        /** 4.8:1 on surface — the floor; placeholders and meta only */
        faint: "#7E7263",
        /** THEMES.paper.colors.tones — decorative flat fills, never data colours */
        terracotta: "#C2410C",
        amber: "#CA8A04",
        olive: "#4D7C0F",
        teal: "#0F766E",
        plum: "#9D174D",
        /** text that sits on a tone fill */
        "on-tone": "#FFF8F0",
      },
      fontFamily: {
        display: ["Fraunces", "Iowan Old Style", "Georgia", "serif"],
        sans: ["Geist", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        /** hero only — one per page */
        display: ["clamp(2.25rem, 1.35rem + 3.8vw, 4.25rem)", { lineHeight: "1.04", letterSpacing: "-0.022em" }],
        /** section headings */
        title: ["clamp(2rem, 1.5rem + 1.9vw, 2.875rem)", { lineHeight: "1.06", letterSpacing: "-0.018em" }],
        /** the largest tile heading */
        heading: ["1.5rem", { lineHeight: "1.22", letterSpacing: "-0.012em" }],
        /** ordinary tile heading */
        subhead: ["1.1875rem", { lineHeight: "1.3", letterSpacing: "-0.008em" }],
        /** intro paragraphs under a display or title */
        lead: ["1.125rem", { lineHeight: "1.62" }],
        body: ["1rem", { lineHeight: "1.6" }],
        small: ["0.875rem", { lineHeight: "1.58" }],
        /** mono eyebrows and pill labels */
        label: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.12em" }],
        micro: ["0.6875rem", { lineHeight: "1.45", letterSpacing: "0.02em" }],
      },
      borderRadius: {
        tile: "14px",
        panel: "18px",
      },
      maxWidth: {
        shell: "1180px",
        /** ~68 characters at `lead` — the readable line-length ceiling */
        measure: "34rem",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        rise: "rise .45s cubic-bezier(.2,.8,.2,1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
