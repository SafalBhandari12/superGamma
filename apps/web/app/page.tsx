"use client";

import { DEFAULT_THEME, type Deck } from "@supergamma/schema";
import { DeckRenderer } from "@supergamma/ui";
import { useState } from "react";
import { useDeckStore } from "../src/store/deckStore";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const { status, deckTitle, expectedSlideCount, slides, activeSlide, error, generate, setActiveSlide } =
    useDeckStore();

  const deck: Deck = {
    id: "draft",
    title: deckTitle ?? "",
    theme: DEFAULT_THEME,
    slides: slides.length > 0 ? slides : [{ layout: "title", title: "..." }],
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">superGamma</h1>

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
        </div>
      )}
    </main>
  );
}
