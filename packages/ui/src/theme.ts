import { COL_GAP_PCT, PAD_PCT, ROW_GAP_PCT, type Theme } from "@supergamma/schema";
import type { CSSProperties } from "react";

/**
 * The mesh gradient: three radial nodes interpolated `in oklch`.
 *
 * The colour space is the whole point. sRGB interpolation routes between two
 * hues through a desaturated middle — blue to yellow literally passes through
 * grey — which is what makes a naive CSS gradient look muddy. OKLCH keeps the
 * midpoint clean, and three nodes (never more) keeps it calm.
 */
function meshGradient(theme: Theme): string {
  const [a, b, c] = theme.meshTones.map((i) => theme.colors.tones[i] ?? theme.colors.tones[0]);
  return [
    `radial-gradient(120% 95% at 12% 8%, color-mix(in oklch, ${a} 38%, transparent), transparent 62%)`,
    `radial-gradient(95% 85% at 88% 22%, color-mix(in oklch, ${b} 28%, transparent), transparent 60%)`,
    `radial-gradient(120% 120% at 70% 100%, color-mix(in oklch, ${c} 20%, transparent), transparent 66%)`,
  ].join(",");
}

/**
 * Theme → CSS custom properties. This is the only bridge between the theme
 * table and the stylesheet, so a deck is re-themed by swapping these values;
 * no component reads a colour directly.
 */
export function themeStyle(theme: Theme): CSSProperties {
  const c = theme.colors;
  return {
    "--canvas": c.canvas,
    "--s1": c.surface1,
    "--s2": c.surface2,
    "--s3": c.surface3,
    "--border": c.border,
    "--text": c.text,
    "--muted": c.muted,
    "--t1": c.tones[0],
    "--t2": c.tones[1],
    "--t3": c.tones[2],
    "--t4": c.tones[3],
    "--t5": c.tones[4],
    "--on-tone": c.onTone,
    "--series-1": c.series[0],
    "--series-2": c.series[1],
    "--series-3": c.series[2],
    "--positive": c.positive,
    "--negative": c.negative,
    "--ghost": c.ghost,
    "--mesh": meshGradient(theme),
    // Spacing comes from the grid module, so the preview and the exported
    // pptx are laid out on identical numbers.
    "--pad": `${PAD_PCT}%`,
    "--col-gap": `${COL_GAP_PCT}%`,
    "--row-gap": `${ROW_GAP_PCT}%`,
    "--font-sans":
      '"Geist",-apple-system,"Segoe UI",system-ui,sans-serif',
    "--font-mono": '"Geist Mono","SF Mono",Consolas,"Liberation Mono",monospace',
  } as CSSProperties;
}

/** Tone-filled tiles flip their text colour; everything else inherits. */
export function isToneSurface(surface: string): boolean {
  return surface.startsWith("tone");
}
