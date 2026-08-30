import { z } from "zod";
import { Slide, SlideLayout, SlideLayoutEnum, SlideSchema } from "./slide.js";
import { Theme, ThemeSchema } from "./theme.js";

/**
 * Deck and GeneratedOutline are hand-written interfaces, not `z.infer`.
 * Both schemas nest an array around another non-trivial schema (an array
 * of a discriminated union, and an array of an object-with-enum), which
 * is deep enough that TS language-service type-checking (not `tsc`
 * itself — it has more budget) sometimes gives up and reports `unknown`
 * at consumption sites. Pinning the exported type to a plain interface
 * means consumers see that interface, not a live inference computation.
 */
export interface Deck {
  id: string;
  title: string;
  theme: Theme;
  slides: Slide[];
}

export const DeckSchema: z.ZodType<Deck> = z.object({
  id: z.string(),
  title: z.string().min(1).max(120),
  theme: ThemeSchema,
  slides: z.array(SlideSchema).min(1).max(30),
});

/**
 * What the model actually returns per generation call: no id, no theme
 * (theme is picked separately, content shouldn't decide it).
 */
export const GeneratedSlideSchema = SlideSchema;

export interface GeneratedOutline {
  deckTitle: string;
  slideOutline: { layout: SlideLayout; summary: string }[];
}

export const GeneratedOutlineSchema: z.ZodType<GeneratedOutline> = z.object({
  deckTitle: z.string().min(1).max(120),
  slideOutline: z
    .array(
      z.object({
        layout: SlideLayoutEnum,
        summary: z.string().min(1).max(140),
      })
    )
    .min(1)
    .max(30),
});
