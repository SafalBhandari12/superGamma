import { z } from "zod";
import { ArchetypeEnum, SlideSchema, type Archetype, type Slide } from "./slide.js";
import { ThemeSchema, type Theme } from "./theme.js";

/**
 * Same rationale as the original DeckSchema: hand-written interfaces rather
 * than `z.infer`, because these nest arrays around discriminated unions and
 * the TS language service gives up and reports `unknown` at call sites.
 */
export interface Deck {
  id: string;
  title: string;
  prompt: string;
  theme: Theme;
  slides: Slide[];
  createdAt: string;
}

export const DeckSchema: z.ZodType<Deck> = z.object({
  id: z.string(),
  title: z.string().min(1).max(120),
  prompt: z.string().min(1).max(2000),
  theme: ThemeSchema,
  slides: z.array(SlideSchema).min(1).max(24),
  createdAt: z.string(),
});

export interface OutlineItem {
  archetype: Archetype;
  /** what this slide has to say — a pointer for the fill step, not the copy */
  brief: string;
}

export interface Outline {
  deckTitle: string;
  slides: OutlineItem[];
}

export const OutlineSchema: z.ZodType<Outline> = z.object({
  deckTitle: z.string().min(1).max(80),
  slides: z
    .array(
      z.object({
        archetype: ArchetypeEnum,
        brief: z.string().min(1).max(180),
      })
    )
    .min(4)
    .max(12),
});
