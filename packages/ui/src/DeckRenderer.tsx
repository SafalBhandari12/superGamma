import type { Deck, Slide, Theme } from "@supergamma/schema";
import { SlideRenderer } from "./SlideRenderer.js";
import { BENTO_CSS } from "./styles.js";
import { themeStyle } from "./theme.js";

/**
 * Wraps slides in the theme's custom properties and injects the stylesheet
 * once. Everything visual resolves from those properties, so re-theming a deck
 * is a props change — no slide content is touched, which is the separation the
 * whole system rests on.
 */
export function ThemeScope({
  theme,
  children,
  className,
  style,
}: {
  theme: Theme;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={className} style={{ ...themeStyle(theme), ...style }}>
      <style dangerouslySetInnerHTML={{ __html: BENTO_CSS }} />
      {children}
    </div>
  );
}

/** A single themed slide — used by the preview list and the thumbnail rail. */
export function ThemedSlide({
  slide,
  theme,
  style,
}: {
  slide: Slide;
  theme: Theme;
  style?: React.CSSProperties;
}) {
  return (
    <ThemeScope theme={theme} style={style}>
      <SlideRenderer slide={slide} />
    </ThemeScope>
  );
}

/**
 * A thumbnail renders the slide at full size and then scales the whole thing
 * down with a transform, rather than rendering into a small box.
 *
 * It has to work this way: type is sized with container queries against the
 * tile, and every step has a clamp() floor so full-size slides never go
 * illegible. Render into a 110px-wide box and every value pins to that floor,
 * so the text stays ~10px while the tile around it shrinks to nothing, and the
 * content overflows. Scaling a correctly-typeset slide keeps every proportion.
 */
export function SlideThumb({
  slide,
  theme,
  width = 116,
}: {
  slide: Slide;
  theme: Theme;
  width?: number;
}) {
  const BASE = 960;
  const scale = width / BASE;
  return (
    <div style={{ width, height: (width * 9) / 16, overflow: "hidden", position: "relative" }}>
      <div
        style={{
          width: BASE,
          height: (BASE * 9) / 16,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <ThemedSlide slide={slide} theme={theme} />
      </div>
    </div>
  );
}

export function DeckRenderer({ deck, gap = 28 }: { deck: Deck; gap?: number }) {
  return (
    <ThemeScope theme={deck.theme} style={{ display: "flex", flexDirection: "column", gap }}>
      {deck.slides.map((slide, i) => (
        <SlideRenderer key={i} slide={slide} />
      ))}
    </ThemeScope>
  );
}
