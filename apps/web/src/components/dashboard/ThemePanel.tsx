"use client";

import { THEMES, THEME_IDS, type Theme } from "@supergamma/schema";
import { useDeckStore } from "../../store/deckStore";
import { ScaledSlide } from "../ScaledSlide";
import { SAMPLE_SLIDES } from "../landing/sampleDeck";

/**
 * The pre-generation theme rail.
 *
 * Five named chips ask people to already know what "Verdant" looks like. Here
 * the choice is made against real slides rendered in the theme — a title slide
 * for the tile fills and a chart slide for the data colours, which are a
 * separate, deliberately different palette. Once a deck exists this rail goes
 * away and theming moves to the stage header, so nothing competes with the
 * slide for width.
 */
const PREVIEW_SLIDES = [
  SAMPLE_SLIDES.find((slide) => slide.archetype === "hero")!,
  SAMPLE_SLIDES.find((slide) => slide.archetype === "chart")!,
];

export function ThemePanel() {
  const { themeId, setThemeId } = useDeckStore();
  const theme = THEMES[themeId];

  return (
    <div className="flex h-full flex-col border-l border-line bg-surface-2">
      <header className="flex h-16 shrink-0 items-center border-b border-line px-4">
        <span className="eyebrow">Theme</span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 scrollbar-thin">
        <div className="flex flex-col gap-2">
          {PREVIEW_SLIDES.map((slide, i) => (
            <div key={i} className="rounded-tile border border-line bg-surface p-1.5">
              <ScaledSlide slide={slide} theme={theme} />
            </div>
          ))}
        </div>

        {/* Names the thing being previewed, so the list below reads as the
            control for it rather than as a second, unrelated block. */}
        <div className="mt-3 flex items-baseline justify-between gap-3 px-1">
          <span className="serif text-subhead">{theme.name}</span>
          <span className="font-mono text-micro uppercase tracking-[0.1em] text-faint">
            {theme.mode}
          </span>
        </div>

        <ul className="mt-3 flex flex-col gap-1 border-t border-line pt-3">
          {THEME_IDS.map((id) => {
            const option = THEMES[id];
            const selected = id === themeId;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setThemeId(id)}
                  aria-pressed={selected}
                  className={`flex w-full items-center gap-3 rounded-[10px] border px-2 py-2 text-left transition-colors duration-150 ${
                    selected
                      ? "border-ink bg-surface"
                      : "border-transparent hover:bg-surface-3"
                  }`}
                >
                  <MiniSlide theme={option} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-small font-medium">{option.name}</span>
                    <span className="block font-mono text-micro uppercase tracking-[0.1em] text-faint">
                      {option.mode}
                    </span>
                  </span>
                  <Check active={selected} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** A theme's canvas, a surface tile and its tone fills, at swatch size. */
function MiniSlide({ theme }: { theme: Theme }) {
  return (
    <span
      className="flex h-10 w-16 shrink-0 flex-col justify-between rounded-[6px] border border-line p-1.5"
      style={{ background: theme.colors.canvas }}
      aria-hidden
    >
      <span
        className="block h-3.5 w-full rounded-[2px]"
        style={{ background: theme.colors.surface1, border: `1px solid ${theme.colors.border}` }}
      />
      <span className="flex gap-[3px]">
        {theme.colors.tones.map((tone) => (
          <span key={tone} className="block h-2.5 flex-1 rounded-[1.5px]" style={{ background: tone }} />
        ))}
      </span>
    </span>
  );
}

function Check({ active }: { active: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
        active ? "border-ink bg-ink" : "border-line-strong"
      }`}
      aria-hidden
    >
      {active && (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.8"
            stroke="#FFF8F0"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}
