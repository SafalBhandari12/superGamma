import { randomUUID } from "node:crypto";
import {
  BENTO_THEMES,
  BentoDeckSchema,
  type BentoDeck,
  type BentoOutline,
  type BentoSlide,
  type BentoThemeId,
} from "@supergamma/schema";
import { NotFoundError } from "../errors/AppError.js";
import { generateBentoOutline, generateBentoSlide } from "../llm/generateBento.js";
import { bentoDeckStore } from "../store.js";

export type BentoDeckEvent =
  | { type: "outline"; data: BentoOutline }
  | { type: "slide"; data: { index: number; slide: BentoSlide } }
  | { type: "done"; data: { deckId: string } };

/**
 * Outline first, then slides in parallel.
 *
 * Slides are independent once the outline exists — each fill call only needs
 * its own archetype and brief — so they fan out rather than running serially.
 * That turns an 8-slide deck from ~8 sequential round-trips into ~2, which is
 * the difference between a usable prompt-to-deck flow and a coffee break.
 * Progress events still stream in outline order as each one lands.
 */
export async function generateBentoDeck(
  prompt: string,
  themeId: BentoThemeId,
  onEvent: (event: BentoDeckEvent) => void
): Promise<BentoDeck> {
  const outline = await generateBentoOutline(prompt);
  onEvent({ type: "outline", data: outline });

  const settled = await Promise.allSettled(
    outline.slides.map((item) =>
      generateBentoSlide(item.archetype, item.brief, outline.deckTitle, prompt)
    )
  );

  const slides: BentoSlide[] = [];
  settled.forEach((result, index) => {
    if (result.status !== "fulfilled") {
      // One bad slide shouldn't sink the deck — drop it and keep the rest.
      console.warn(
        `slide ${index} (${outline.slides[index].archetype}) failed:`,
        result.reason instanceof Error ? result.reason.message : result.reason
      );
      return;
    }
    slides.push(result.value);
    onEvent({ type: "slide", data: { index, slide: result.value } });
  });

  if (slides.length === 0) {
    throw new Error("Every slide failed to generate.");
  }

  const deck = BentoDeckSchema.parse({
    id: randomUUID(),
    title: outline.deckTitle,
    prompt,
    theme: BENTO_THEMES[themeId],
    slides,
    createdAt: new Date().toISOString(),
  });

  bentoDeckStore.save(deck);
  onEvent({ type: "done", data: { deckId: deck.id } });
  return deck;
}

export function getBentoDeckById(id: string): BentoDeck {
  const deck = bentoDeckStore.get(id);
  if (!deck) throw new NotFoundError(`No bento deck with id "${id}"`);
  return deck;
}

/** Re-theme an existing deck without regenerating any content. */
export function retheme(id: string, themeId: BentoThemeId): BentoDeck {
  const deck = getBentoDeckById(id);
  const next: BentoDeck = { ...deck, theme: BENTO_THEMES[themeId] };
  bentoDeckStore.save(next);
  return next;
}
