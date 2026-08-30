import type { Deck } from "@supergamma/schema";
import type { CSSProperties } from "react";
import { SlideRenderer } from "./SlideRenderer.js";

function themeStyle(theme: Deck["theme"]): CSSProperties {
  return {
    ["--sg-background" as string]: theme.colors.background,
    ["--sg-text" as string]: theme.colors.text,
    ["--sg-accent" as string]: theme.colors.accent,
    ["--sg-muted" as string]: theme.colors.muted,
    ["--sg-font-heading" as string]: theme.fonts.heading,
    ["--sg-font-body" as string]: theme.fonts.body,
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

  return (
    <div
      className="aspect-video w-full overflow-hidden rounded-lg border shadow-sm"
      style={{ ...themeStyle(deck.theme), background: "var(--sg-background)" }}
    >
      <SlideRenderer slide={slide} />
    </div>
  );
}
