"use client";

import { THEMES, THEME_IDS, type ThemeId } from "@supergamma/schema";
import { useState } from "react";
import { ScaledSlide } from "../ScaledSlide";
import { SAMPLE_SLIDES, SAMPLE_TABS } from "./sampleDeck";

/**
 * The proof tile. Two independent axes — which slide, which theme — because
 * the separation between them is the product's central claim: content is
 * generated once, and a theme swap is a pure restyle. Letting a visitor flip
 * themes on a slide they picked demonstrates that in a way copy cannot.
 */
export function DeckPreview() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [themeId, setThemeId] = useState<ThemeId>("paper");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between gap-3">
        <span className="eyebrow">Live renderer</span>
        <span className="font-mono text-micro uppercase tracking-[0.1em] text-faint">
          {SAMPLE_SLIDES[slideIndex].archetype}
        </span>
      </div>

      {/* The slide and its caption take the slack, so this tile matches the
          headline tile's height without leaving a hole under the controls. */}
      <div className="flex flex-1 flex-col justify-center gap-5 py-6">
        <div className="w-full rounded-tile border border-line bg-surface-3 p-2">
          <ScaledSlide slide={SAMPLE_SLIDES[slideIndex]} theme={THEMES[themeId]} />
        </div>
        <p className="max-w-measure text-small text-muted">{SAMPLE_TABS[slideIndex].caption}</p>
      </div>

      <div className="mt-auto space-y-3 border-t border-line pt-4">
        <div className="flex items-center gap-3">
          <span className="eyebrow w-[3.25rem] shrink-0">Slide</span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_TABS.map((tab, i) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => setSlideIndex(i)}
                aria-pressed={i === slideIndex}
                className={`rounded-[8px] px-3 py-1.5 text-micro font-medium tracking-normal transition-colors duration-150 ${
                  i === slideIndex
                    ? "bg-ink text-on-tone"
                    : "border border-line text-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="eyebrow w-[3.25rem] shrink-0">Theme</span>
          <ThemeSwatches value={themeId} onChange={setThemeId} />
        </div>
      </div>
    </div>
  );
}

export function ThemeSwatches({
  value,
  onChange,
}: {
  value: ThemeId;
  onChange: (id: ThemeId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {THEME_IDS.map((id) => {
        const theme = THEMES[id];
        const selected = id === value;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            title={theme.name}
            aria-label={`${theme.name} theme`}
            aria-pressed={selected}
            className={`flex items-center gap-2 rounded-[8px] border p-1 pr-2.5 transition-colors duration-150 ${
              selected ? "border-ink bg-surface-2" : "border-line hover:border-line-strong"
            }`}
          >
            <span className="flex overflow-hidden rounded-[4px]" aria-hidden>
              <i className="block h-4 w-2.5" style={{ background: theme.colors.canvas }} />
              {theme.colors.tones.slice(0, 3).map((tone) => (
                <i key={tone} className="block h-4 w-2.5" style={{ background: tone }} />
              ))}
            </span>
            <span
              className={`text-micro font-medium ${selected ? "text-ink" : "text-muted"}`}
            >
              {theme.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
