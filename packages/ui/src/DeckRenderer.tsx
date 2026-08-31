import type { Deck } from "@supergamma/schema";
import type { CSSProperties } from "react";
import { SlideRenderer } from "./SlideRenderer.js";

const SERIF_FONTS = new Set(["Playfair Display", "Georgia"]);

/**
 * A bare font name with no fallback silently degrades to the browser's
 * default (often serif) the moment the webfont fails to load — this is
 * what made every "sans-serif" theme render as Times New Roman before.
 * Always pin a real generic fallback alongside the requested family.
 */
function withFallback(font: string): string {
  return `"${font}", ${SERIF_FONTS.has(font) ? "serif" : "sans-serif"}`;
}

function themeStyle(theme: Deck["theme"]): CSSProperties {
  return {
    ["--sg-background" as string]: theme.colors.background,
    ["--sg-text" as string]: theme.colors.text,
    ["--sg-accent" as string]: theme.colors.accent,
    ["--sg-muted" as string]: theme.colors.muted,
    ["--sg-font-heading" as string]: withFallback(theme.fonts.heading),
    ["--sg-font-body" as string]: withFallback(theme.fonts.body),
  };
}

/**
 * The single renderer used for the live editor now, and for thumbnails /
 * PDF export later — same component tree, so what the user sees while
 * editing is exactly what gets exported. Never build a second renderer
 * for export; that's how the two drift.
 */
export function DeckRenderer({
  deck,
  activeSlide,
}: {
  deck: Deck;
  activeSlide: number;
}) {
  const slide = deck.slides[activeSlide];
  if (!slide) return null;

  const pageLabel = `${String(activeSlide + 1).padStart(2, "0")} / ${String(
    deck.slides.length
  ).padStart(2, "0")}`;

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-lg border shadow-sm"
      style={{
        ...themeStyle(deck.theme),
        background: "var(--sg-background)",
        borderColor: "color-mix(in srgb, var(--sg-muted) 20%, transparent)",
      }}
    >
      {/* Signature corner accent — a fixed two-tone triangle, repeated on every
          slide regardless of layout. This is the single recurring brand motif
          (mirrors how real templates use one consistent geometric device),
          drawn once here instead of duplicated per-layout. Flat fills, no
          blur/shadow — real decks favor sharp color blocks over soft glows. */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-28 w-28"
        style={{
          background: "color-mix(in srgb, var(--sg-accent) 45%, transparent)",
          clipPath: "polygon(100% 0, 100% 100%, 0 0)",
        }}
      />
      <div
        className="pointer-events-none absolute right-0 top-0 h-16 w-16"
        style={{ background: "var(--sg-accent)", clipPath: "polygon(100% 0, 100% 100%, 0 0)" }}
      />
      <SlideRenderer slide={slide} />
      <div
        className="pointer-events-none absolute inset-x-8 bottom-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "color-mix(in srgb, var(--sg-muted) 85%, transparent)" }}
      >
        <span className="max-w-[60%] truncate">{deck.title}</span>
        <span>{pageLabel}</span>
      </div>
    </div>
  );
}
