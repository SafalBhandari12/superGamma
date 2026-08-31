import { randomUUID } from "node:crypto";
import {
  THEMES,
  DeckSchema,
  type Deck,
  type Outline,
  type Slide,
  type ThemeId,
} from "@supergamma/schema";
import { NotFoundError } from "../errors/AppError.js";
import { generateOutline, generateSlide } from "../llm/generate.js";
import { deckStore } from "../store.js";

export type DeckEvent =
  | { type: "outline"; data: Outline }
  | { type: "slide"; data: { index: number; slide: Slide } }
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
export async function generateDeck(
  prompt: string,
  themeId: ThemeId,
  onEvent: (event: DeckEvent) => void
): Promise<Deck> {
  const outline = await generateOutline(prompt);
  onEvent({ type: "outline", data: outline });

  const settled = await Promise.allSettled(
    outline.slides.map((item) =>
      generateSlide(item.archetype, item.brief, outline.deckTitle, prompt)
    )
  );

  const slides: Slide[] = [];
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

  const deck = DeckSchema.parse({
    id: randomUUID(),
    title: outline.deckTitle,
    prompt,
    theme: THEMES[themeId],
    slides,
    createdAt: new Date().toISOString(),
  });

  deckStore.save(deck);
  onEvent({ type: "done", data: { deckId: deck.id } });
  return deck;
}

export function getDeckById(id: string): Deck {
  const deck = deckStore.get(id);
  if (!deck) throw new NotFoundError(`No deck with id "${id}"`);
  return deck;
}

/** Re-theme an existing deck without regenerating any content. */
export function retheme(id: string, themeId: ThemeId): Deck {
  const deck = getDeckById(id);
  const next: Deck = { ...deck, theme: THEMES[themeId] };
  deckStore.save(next);
  return next;
}
