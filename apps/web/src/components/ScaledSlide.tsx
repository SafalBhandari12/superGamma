"use client";

import type { Slide, Theme } from "@supergamma/schema";
import { ThemedSlide } from "@supergamma/ui";
import { useEffect, useRef, useState } from "react";

/**
 * A slide sized to whatever box it is dropped into, at correct proportions.
 *
 * Same reasoning as SlideThumb in @supergamma/ui: tile type is set with
 * container queries that have clamp() floors, so rendering a slide into a
 * narrow box pins every step to its floor and the text ends up oversized
 * relative to the tile. Rendering at the 960px base and scaling the whole
 * thing keeps the design intact at any width — including the 1400px stage in
 * the dashboard, where scaling *up* is equally necessary.
 */
const BASE_W = 960;
const BASE_H = 540;

export function ScaledSlide({ slide, theme }: { slide: Slide; theme: Theme }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = width / BASE_W;

  return (
    <div ref={ref} style={{ width: "100%", aspectRatio: "16 / 9", overflow: "hidden" }}>
      {width > 0 && (
        <div
          style={{
            width: BASE_W,
            height: BASE_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <ThemedSlide slide={slide} theme={theme} />
        </div>
      )}
    </div>
  );
}
