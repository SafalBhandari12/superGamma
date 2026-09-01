"use client";

import type { Slide, Theme } from "@supergamma/schema";
import { ThemedSlide } from "@supergamma/ui";
import { useCallback, useEffect, useState } from "react";

// Slides are laid out at a fixed 960x540 base (see SlideThumb in @supergamma/ui) —
// tile type scale is driven by container queries with clamp() ceilings, so
// growing the slide via CSS width would just hit those ceilings and look
// undersized. Rendering at base size and scaling the whole box up keeps every
// proportion exactly as designed.
const BASE_W = 960;
const BASE_H = 540;

export function PresentationMode({
  slides,
  theme,
  startIndex,
  onClose,
}: {
  slides: Slide[];
  theme: Theme;
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);

  const clampIndex = useCallback((i: number) => Math.min(Math.max(i, 0), slides.length - 1), [slides.length]);
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1)), [clampIndex]);
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1)), [clampIndex]);

  const close = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onClose();
  }, [onClose]);

  // Follow the browser out of fullscreen if the user exits it natively
  // (Esc, F11, swipe down) rather than through our own close button.
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) onClose();
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [onClose]);

  useEffect(() => {
    const resize = () => {
      setScale(Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H));
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, close]);

  const slide = slides[index];
  const atStart = index === 0;
  const atEnd = index === slides.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      onClick={(e) => {
        if (e.target === e.currentTarget) next();
      }}
    >
      <div style={{ width: BASE_W, height: BASE_H, transform: `scale(${scale})` }}>
        <ThemedSlide slide={slide} theme={theme} />
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        aria-label="Exit presentation"
        className="absolute right-5 top-5 rounded-full bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20"
      >
        Esc
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
        disabled={atStart}
        aria-label="Previous slide"
        className="absolute left-5 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-xl text-white transition hover:bg-white/20 disabled:opacity-20"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        disabled={atEnd}
        aria-label="Next slide"
        className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-xl text-white transition hover:bg-white/20 disabled:opacity-20"
      >
        ›
      </button>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tabular-nums text-white">
        {index + 1} / {slides.length}
      </div>
    </div>
  );
}
