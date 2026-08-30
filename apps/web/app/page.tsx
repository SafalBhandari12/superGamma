"use client";

import { THEMES, type Deck, type ThemeId } from "@supergamma/schema";
import { DeckRenderer } from "@supergamma/ui";
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

  const deck: Deck = {
    id: "draft",
    title: deckTitle ?? "",
    theme: THEMES[themeId],
    slides: slides.length > 0 ? slides : [{ layout: "title", title: "..." }],
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">superGamma</h1>

      <div className="flex gap-2">
        {(Object.keys(THEMES) as ThemeId[]).map((id) => {
          const theme = THEMES[id];
          const selected = id === themeId;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setThemeId(id)}
              title={theme.name}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                selected ? "border-indigo-600 ring-1 ring-indigo-600" : "border-gray-300"
              }`}
            >
              <span
                className="h-4 w-4 rounded-full border"
                style={{ background: theme.colors.background, borderColor: theme.colors.muted }}
              />
              <span
                className="h-4 w-4 rounded-full"
                style={{ background: theme.colors.accent }}
              />
              {theme.name}
            </button>
          );
        })}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (prompt.trim() && status !== "generating") generate(prompt.trim());
        }}
      >
        <input
          className="flex-1 rounded-md border px-3 py-2"
          placeholder="What's the deck about?"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          className="rounded-md bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
          disabled={status === "generating"}
          type="submit"
        >
          {status === "generating" ? "Generating…" : "Generate"}
        </button>
      </form>

      {status === "generating" && (
        <p className="text-sm text-gray-500">
          {deckTitle
            ? `"${deckTitle}" — ${slides.length}/${expectedSlideCount} slides`
            : "Writing outline…"}
        </p>
      )}
      {status === "error" && <p className="text-sm text-red-600">{error}</p>}

      {slides.length > 0 && (
        <div className="flex flex-col gap-4">
          <DeckRenderer deck={deck} activeSlide={Math.min(activeSlide, slides.length - 1)} />
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2 overflow-x-auto">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-10 w-16 shrink-0 rounded border text-xs ${
                    i === activeSlide ? "border-indigo-600" : "border-gray-300"
                  }`}
                >
                  {i + 1}
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
              className="shrink-0 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {exporting ? "Exporting…" : "Download .pptx"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
