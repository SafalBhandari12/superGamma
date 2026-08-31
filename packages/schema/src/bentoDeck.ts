import { z } from "zod";
import { BentoArchetypeEnum, BentoSlideSchema, type BentoArchetype, type BentoSlide } from "./bento.js";
import { BentoThemeSchema, type BentoTheme } from "./bentoTheme.js";

/**
 * Same rationale as the original DeckSchema: hand-written interfaces rather
 * than `z.infer`, because these nest arrays around discriminated unions and
 * the TS language service gives up and reports `unknown` at call sites.
 */
export interface BentoDeck {
  id: string;
  title: string;
  prompt: string;
  theme: BentoTheme;
  slides: BentoSlide[];
  createdAt: string;
}

export const BentoDeckSchema: z.ZodType<BentoDeck> = z.object({
  id: z.string(),
  title: z.string().min(1).max(120),
  prompt: z.string().min(1).max(2000),
  theme: BentoThemeSchema,
  slides: z.array(BentoSlideSchema).min(1).max(24),
  createdAt: z.string(),
});

export interface BentoOutlineItem {
  archetype: BentoArchetype;
  /** what this slide has to say — a pointer for the fill step, not the copy */
  brief: string;
}

export interface BentoOutline {
  deckTitle: string;
  slides: BentoOutlineItem[];
}

export const BentoOutlineSchema: z.ZodType<BentoOutline> = z.object({
  deckTitle: z.string().min(1).max(80),
  slides: z
    .array(
      z.object({
        archetype: BentoArchetypeEnum,
        brief: z.string().min(1).max(180),
      })
    )
    .min(4)
    .max(12),
});
