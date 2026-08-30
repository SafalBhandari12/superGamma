import { z } from "zod";

/**
 * The layout catalog. This IS the design taste — the model can only pick
 * from what's defined here, so it can never invent a layout we haven't
 * already made look good. Adding a layout means adding a schema entry
 * AND a renderer component (see packages/ui) — never one without the other.
 *
 * Length limits (.max()) double as the layout engine's capacity contract:
 * the renderer is only ever asked to fit content within these bounds.
 */

const shortText = z.string().min(1).max(80);
const bodyText = z.string().min(1).max(220);

export const TitleSlideSchema = z.object({
  layout: z.literal("title"),
  title: shortText,
  subtitle: shortText.optional(),
});

export const BulletsSlideSchema = z.object({
  layout: z.literal("bullets"),
  title: shortText,
  bullets: z.array(bodyText).min(2).max(6),
});

export const TwoColumnSlideSchema = z.object({
  layout: z.literal("two-column"),
  title: shortText,
  left: z.array(bodyText).min(1).max(4),
  right: z.array(bodyText).min(1).max(4),
});

export const BigStatSlideSchema = z.object({
  layout: z.literal("big-stat"),
  stat: z.string().min(1).max(12),
  label: shortText,
  supportingText: bodyText.optional(),
});

export const QuoteSlideSchema = z.object({
  layout: z.literal("quote"),
  quote: bodyText,
  attribution: shortText.optional(),
});

const agendaItem = z.object({ title: shortText, description: bodyText });

export const AgendaSlideSchema = z.object({
  layout: z.literal("agenda"),
  title: shortText,
  items: z.array(agendaItem).min(3).max(6),
});

const timelineStep = z.object({ label: shortText, description: bodyText });

export const TimelineSlideSchema = z.object({
  layout: z.literal("timeline"),
  title: shortText,
  steps: z.array(timelineStep).min(3).max(5),
});

const tableCell = z.string().min(1).max(40);

export const TableSlideSchema = z.object({
  layout: z.literal("table"),
  title: shortText,
  columns: z.array(tableCell).min(2).max(4),
  rows: z.array(z.array(tableCell).min(2).max(4)).min(2).max(6),
});

export const SlideSchema = z.discriminatedUnion("layout", [
  TitleSlideSchema,
  BulletsSlideSchema,
  TwoColumnSlideSchema,
  BigStatSlideSchema,
  QuoteSlideSchema,
  AgendaSlideSchema,
  TimelineSlideSchema,
  TableSlideSchema,
]);

export type Slide = z.infer<typeof SlideSchema>;
export type SlideLayout = Slide["layout"];

export const LAYOUT_NAMES = [
  "title",
  "bullets",
  "two-column",
  "big-stat",
  "quote",
  "agenda",
  "timeline",
  "table",
] as const satisfies readonly SlideLayout[];

export const SlideLayoutEnum = z.enum(LAYOUT_NAMES);

/**
 * Per-layout schemas, keyed by layout name. Used for the LLM call instead
 * of the discriminated union directly: OpenAI/Azure structured-output
 * validation requires the top-level schema to be `type: "object"`, and
 * zod-to-json-schema turns a discriminatedUnion into a top-level `anyOf`.
 * Since the layout is already chosen (by the outline step) before we ask
 * the model to fill a slide, asking for just that layout's schema is both
 * the fix and the more precise prompt.
 */
export const SLIDE_LAYOUT_SCHEMAS = {
  title: TitleSlideSchema,
  bullets: BulletsSlideSchema,
  "two-column": TwoColumnSlideSchema,
  "big-stat": BigStatSlideSchema,
  quote: QuoteSlideSchema,
  agenda: AgendaSlideSchema,
  timeline: TimelineSlideSchema,
  table: TableSlideSchema,
} as const satisfies Record<SlideLayout, z.ZodTypeAny>;
