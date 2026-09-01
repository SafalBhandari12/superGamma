"use client";

import { THEMES, type Deck } from "@supergamma/schema";
import { SlideThumb } from "@supergamma/ui";
import { useEffect, useState } from "react";
import { exportDeckAsPptx } from "../../lib/exportPptx";
import { useDeckStore } from "../../store/deckStore";
import { PresentationMode } from "../PresentationMode";
import { ScaledSlide } from "../ScaledSlide";
import { ThemeSwatches } from "../landing/DeckPreview";

export function DeckStage() {
  const {
    status,
    prompt,
    deckTitle,
    expectedSlideCount,
    slides,
    activeSlide,
    themeId,
    error,
    setThemeId,
    setActiveSlide,
    stepSlide,
  } = useDeckStore();

  const [exporting, setExporting] = useState(false);
  const [presenting, setPresenting] = useState(false);

  const theme = THEMES[themeId];
  const generating = status === "generating";
  const current = Math.min(activeSlide, Math.max(slides.length - 1, 0));

  // Arrow keys drive the stage, but only when focus isn't in a field — the
  // composer is one Escape away and typing there must not page the deck.
  useEffect(() => {
    if (presenting) return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") stepSlide(1);
      if (e.key === "ArrowLeft") stepSlide(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presenting, stepSlide]);

  const deck: Deck = {
    id: "draft",
    title: deckTitle ?? "Untitled deck",
    prompt,
    theme,
    slides,
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-line bg-surface-2 px-5 py-4 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="serif truncate text-subhead">{deckTitle ?? "Planning the outline…"}</h1>
            <p className="mt-0.5 truncate font-mono text-micro uppercase tracking-[0.1em] text-faint">
              {generating
                ? `${slides.length} of ${expectedSlideCount || "…"} slides`
                : `${slides.length} slides · ${theme.name}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ThemeSwatches value={themeId} onChange={setThemeId} />
            <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
            <button
              type="button"
              disabled={slides.length === 0}
              onClick={() => {
                // Request fullscreen synchronously in the click handler so the
                // user gesture isn't lost by the time the overlay mounts.
                document.documentElement.requestFullscreen?.().catch(() => {});
                setPresenting(true);
              }}
              className="btn-secondary"
            >
              Present
            </button>
            <button
              type="button"
              disabled={exporting || generating || slides.length === 0}
              onClick={async () => {
                setExporting(true);
                try {
                  await exportDeckAsPptx(deck);
                } finally {
                  setExporting(false);
                }
              }}
              className="btn-primary"
            >
              {exporting ? "Exporting…" : "Download .pptx"}
            </button>
          </div>
        </div>

        {generating && (
          <div className="mt-4 flex items-center gap-3">
            <div
              className="h-1 flex-1 overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-valuenow={slides.length}
              aria-valuemin={0}
              aria-valuemax={expectedSlideCount || undefined}
            >
              <div
                className="h-full rounded-full bg-terracotta transition-[width] duration-500"
                style={{
                  width: expectedSlideCount
                    ? `${Math.max((slides.length / expectedSlideCount) * 100, 4)}%`
                    : "8%",
                }}
              />
            </div>
            <span className="shrink-0 font-mono text-micro uppercase tracking-[0.1em] text-muted">
              {expectedSlideCount ? "Filling tiles" : "Planning"}
            </span>
          </div>
        )}
      </header>

      {error && (
        <p
          role="alert"
          className="shrink-0 border-b px-5 py-3 text-small sm:px-7"
          style={{ borderColor: "#E8CDBB", color: "#C2410C", background: "#FDF4EE" }}
        >
          {error}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-5 py-6 sm:px-7 scrollbar-thin">
        {/* Bound by height as well as width. A 16:9 slide capped only on width
            leaves a tall gap above the filmstrip on a laptop screen; the
            subtraction is the header, the filmstrip and this padding. */}
        <div
          className="mx-auto w-full"
          style={{ maxWidth: "min(1040px, calc((100vh - 330px) * 16 / 9))" }}
        >
          {slides.length > 0 ? (
            <div className="tile p-2 sm:p-3">
              <ScaledSlide slide={slides[current]} theme={theme} />
            </div>
          ) : (
            <SlideSkeleton />
          )}

          {slides.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => stepSlide(-1)}
                disabled={current === 0}
                className="btn-secondary h-9 w-9 px-0"
                aria-label="Previous slide"
              >
                ←
              </button>
              <span className="nums font-mono text-micro uppercase tracking-[0.12em] text-muted">
                {current + 1} / {slides.length}
              </span>
              <button
                type="button"
                onClick={() => stepSlide(1)}
                disabled={current >= slides.length - 1}
                className="btn-secondary h-9 w-9 px-0"
                aria-label="Next slide"
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="shrink-0 border-t border-line bg-surface-2 px-5 py-3 sm:px-7">
        <div className="flex items-end gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {slides.map((slide, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveSlide(i)}
              aria-label={`Slide ${i + 1}: ${slide.archetype}`}
              aria-current={i === current}
              className="group shrink-0 text-left"
            >
              <span
                className={`block overflow-hidden rounded-[8px] border transition-colors duration-150 ${
                  i === current
                    ? "border-ink"
                    : "border-line group-hover:border-line-strong"
                }`}
              >
                <SlideThumb slide={slide} theme={theme} width={118} />
              </span>
              <span
                className={`mt-1 block nums font-mono text-micro ${
                  i === current ? "text-ink" : "text-faint"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </button>
          ))}
          {/* Placeholders for slides still in flight, so the rail doesn't jump. */}
          {generating &&
            Array.from({ length: Math.max(expectedSlideCount - slides.length, 0) }).map((_, i) => (
              <span
                key={`pending-${i}`}
                className="block h-[66px] w-[118px] shrink-0 animate-pulse rounded-[8px] border border-line bg-surface-3"
                aria-hidden
              />
            ))}
        </div>
      </footer>

      {presenting && (
        <PresentationMode
          slides={slides}
          theme={theme}
          startIndex={current}
          onClose={() => setPresenting(false)}
        />
      )}
    </div>
  );
}

/** Holds the stage's shape while the first slide is still being filled. */
function SlideSkeleton() {
  return (
    <div className="tile grid aspect-[16/9] w-full grid-cols-6 grid-rows-4 gap-2 bg-surface-3 p-3">
      {[
        "col-span-4 row-span-3",
        "col-span-2 row-span-2",
        "col-span-2 row-span-1",
        "col-span-4 row-span-1",
      ].map((span, i) => (
        <span
          key={i}
          className={`${span} animate-pulse rounded-[10px] bg-surface-2`}
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}
