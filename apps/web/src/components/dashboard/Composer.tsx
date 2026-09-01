"use client";

import { THEMES } from "@supergamma/schema";
import { useState } from "react";
import { useDeckStore } from "../../store/deckStore";
import { ThemeSwatches } from "../landing/DeckPreview";

/**
 * Examples do double duty: they show the prompt shape that produces a good
 * outline (audience + subject + ask), and they give a first-time user a way
 * to see real output without having to invent a topic.
 */
const EXAMPLES = [
  "Series B deck for a grid-scale battery developer",
  "Explain transformers to a non-technical exec team",
  "Q3 board update for a B2B SaaS at $4M ARR",
  "Case for moving our fleet to electric vans",
];

/**
 * What a first run actually does, in the order it does it. The outline call
 * finishes before any slide starts, so there is a real pause on a blank stage
 * that reads as a hang unless you were told to expect it.
 */
const WHAT_HAPPENS = [
  { title: "An outline first", body: "Slide count and a layout per slide, chosen for the argument." },
  { title: "Slides stream in", body: "Filled in parallel, appearing on the stage as each one lands." },
  { title: "Present or export", body: "Full-screen presenter mode, or an editable .pptx." },
];

export function Composer() {
  const { themeId, setThemeId, generate, status, error } = useDeckStore();
  const [value, setValue] = useState("");
  const busy = status === "generating";

  const theme = THEMES[themeId];

  const submit = () => {
    const prompt = value.trim();
    if (prompt.length >= 3 && !busy) generate(prompt);
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-5 py-12 sm:px-8">
      <span className="eyebrow">New deck</span>
      <h1 className="title-serif mt-4">
        What&apos;s the deck about?
      </h1>
      <p className="mt-5 max-w-measure text-lead text-muted">
        One sentence is enough. Naming the audience and the ask makes the outline sharper.
      </p>

      <form
        className="mt-7"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="tile p-3">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              // Enter alone would fight multi-line prompts, so submit is the
              // modifier chord people already expect from chat composers.
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            rows={3}
            maxLength={2000}
            autoFocus
            placeholder="Series B deck for a grid-scale battery developer, for climate-fund partners"
            className="w-full resize-none bg-transparent px-2 py-2 text-body text-ink placeholder:text-faint focus:outline-none"
          />
          {/* Two rows, not one: five theme chips and a button competing for a
              single line wrapped into a ragged block at every width worth
              supporting. */}
          <div className="mt-1 space-y-3 border-t border-line px-2 pt-3">
            {/* At xl and up the right-hand rail owns this, with real slide
                previews; this row is the narrow-screen fallback. */}
            <div className="flex items-start gap-3 xl:hidden">
              <span className="eyebrow mt-2 shrink-0">Theme</span>
              <div>
                <ThemeSwatches value={themeId} onChange={setThemeId} />
                {/* Names alone ("Verdant"?) teach nothing, and the cost of
                    picking wrong is the thing worth saying: there isn't one. */}
                <p className="mt-2 text-micro text-muted">
                  <span className="font-medium text-ink">{theme.name}</span> — a {theme.mode} palette.
                  You can restyle the finished deck at any time; a theme swap never regenerates it.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              {/* The handler takes either modifier, so name both rather than
                  showing a Mac glyph to someone on Windows or Linux. */}
              <span className="hidden font-mono text-micro text-faint sm:block">
                ⌘ / Ctrl + Enter to generate
              </span>
              <button
                type="submit"
                disabled={busy || value.trim().length < 3}
                className="btn-primary ml-auto"
              >
                {busy ? "Generating…" : "Generate deck"}
              </button>
            </div>
          </div>
        </div>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-[10px] border px-3.5 py-2.5 text-small"
          style={{ borderColor: "#C2410C", color: "#C2410C", background: "#FDF4EE" }}
        >
          {error}
        </p>
      )}

      {/* Nothing else on this screen says what pressing Generate sets off, and
          the first run is a blank stage for several seconds before the first
          tile lands. Three lines cover it. */}
      <ol className="mt-7 grid gap-3 sm:grid-cols-3">
        {WHAT_HAPPENS.map((step, i) => (
          <li key={step.title} className="flex gap-2.5">
            <span className="nums mt-px font-mono text-micro text-terracotta">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>
              <span className="block text-small font-medium">{step.title}</span>
              <span className="mt-0.5 block text-micro leading-relaxed text-muted">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-8 border-t border-line pt-7">
        <p className="eyebrow">Try one</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setValue(example)}
              className="rounded-[10px] border border-line bg-surface px-3.5 py-2 text-left text-small text-muted transition-colors duration-150 hover:border-line-strong hover:text-ink"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
