import { randomUUID } from "node:crypto";
import {
  DEFAULT_THEME,
  DeckSchema,
  type Deck,
  type GeneratedOutline,
  type Slide,
} from "@supergamma/schema";
import { NotFoundError } from "../errors/AppError.js";
import { generateOutline, generateSlide } from "../llm/generate.js";
import { deckStore } from "../store.js";

export type DeckEvent =
  | { type: "outline"; data: GeneratedOutline }
  | { type: "slide"; data: { index: number; slide: Slide } }
  | { type: "done"; data: { deckId: string } };

/**
 * Outline first, then slides one at a time, emitting an event after each
 * step — the controller turns these into SSE frames so the client sees
 * progress instead of a single 20-40s blocking response.
 */
export async function generateDeck(
  prompt: string,
  onEvent: (event: DeckEvent) => void
): Promise<Deck> {
  const outline = await generateOutline(prompt);
  onEvent({ type: "outline", data: outline });

  const slides: Slide[] = [];
  for (let i = 0; i < outline.slideOutline.length; i++) {
    const item = outline.slideOutline[i];
    const slide = await generateSlide(item.layout, item.summary, outline.deckTitle);
    slides.push(slide);
    onEvent({ type: "slide", data: { index: i, slide } });
  }

  const deck = DeckSchema.parse({
    id: randomUUID(),
    title: outline.deckTitle,
    theme: DEFAULT_THEME,
    slides,
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
