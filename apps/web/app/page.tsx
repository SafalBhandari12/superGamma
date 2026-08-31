"use client";

import { THEMES, THEME_IDS, type Deck, type ThemeId } from "@supergamma/schema";
import { SlideThumb, ThemedSlide } from "@supergamma/ui";
import { useState } from "react";
import { exportDeckAsPptx } from "../src/lib/exportPptx";
import { useDeckStore } from "../src/store/deckStore";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [exporting, setExporting] = useState(false);
  const {
    status,
    deckTitle,
    expectedSlideCount,
    slides,
    activeSlide,
    error,
    themeId,
    generate,
    setActiveSlide,
    setThemeId,
  } = useDeckStore();

  const theme = THEMES[themeId];
  const hasSlides = slides.length > 0;
  const current = Math.min(activeSlide, Math.max(slides.length - 1, 0));

  const deck: Deck = {
    id: "draft",
    title: deckTitle ?? "Untitled deck",
    prompt,
    theme,
    slides,
    createdAt: new Date().toISOString(),
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-8">
      <header className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">superGamma</h1>
        <span className="text-sm text-neutral-500">bento-grid decks from one prompt</span>
      </header>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (prompt.trim() && status !== "generating") generate(prompt.trim());
        }}
      >
        <input
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2"
          placeholder="What's the deck about?"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          className="rounded-lg bg-neutral-900 px-5 py-2 text-white disabled:opacity-40"
          disabled={status === "generating"}
          type="submit"
        >
          {status === "generating" ? "Generating…" : "Generate"}
        </button>
      </form>

      {/* Re-theming is a pure restyle — it never regenerates content. */}
      <div className="flex flex-wrap gap-2">
        {THEME_IDS.map((id) => {
          const t = THEMES[id];
          const selected = id === themeId;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setThemeId(id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                selected ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-300"
              }`}
            >
              <span className="flex overflow-hidden rounded" aria-hidden>
                <i className="block h-4 w-2" style={{ background: t.colors.canvas }} />
                {t.colors.tones.slice(0, 3).map((tone) => (
                  <i key={tone} className="block h-4 w-2" style={{ background: tone }} />
                ))}
              </span>
              {t.name}
            </button>
          );
        })}
      </div>

      {status === "generating" && (
        <p className="text-sm text-neutral-500">
          {deckTitle
            ? `"${deckTitle}" — ${slides.length}/${expectedSlideCount} slides`
            : "Planning the outline…"}
        </p>
      )}
      {status === "error" && <p className="text-sm text-red-600">{error}</p>}

      {hasSlides && (
        <div className="flex flex-col gap-4">
          <ThemedSlide slide={slides[current]} theme={theme} />

          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {slides.map((slide, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  aria-label={`Slide ${i + 1}: ${slide.archetype}`}
                  className={`shrink-0 overflow-hidden rounded-md border transition ${
                    i === current ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-300"
                  }`}
                >
                  <SlideThumb slide={slide} theme={theme} />
                </button>
              ))}
            </div>

            <button
              onClick={async () => {
                setExporting(true);
                try {
                  await exportDeckAsPptx(deck);
                } finally {
                  setExporting(false);
                }
              }}
              disabled={exporting || status === "generating"}
              className="shrink-0 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              {exporting ? "Exporting…" : "Download .pptx"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
