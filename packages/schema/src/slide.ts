import { z } from "zod";

/**
 * The archetype catalog — the whole design surface of the app.
 *
 * The model can only pick from shapes we have already made look good, and
 * every `.max()` here is the layout engine's capacity contract: a tile is
 * sized for content that fits inside these bounds.
 *
 * Limits are deliberately tight. Bento type is set at presentation scale
 * (body ~20pt, headings ~30pt), so a tile holds roughly half the characters
 * a web card would, and overflow is this system's worst failure mode.
 */

/**
 * Words that mean the sentence hasn't finished. If a field ends on one of
 * these, or on dangling punctuation, the model ran at the character limit and
 * stopped mid-thought — "control shifts to cost,", "LFP packs can cost about".
 *
 * Instructing the model not to do this does not work; rejecting it does. A
 * failure here comes back through the repair turn with the message below, and
 * the model rewrites the field shorter instead of truncating it.
 */
const DANGLING =
  /(^|\s)(and|or|but|to|of|the|a|an|with|for|in|on|at|by|from|as|that|which|into|per|than|about|over|under|across)\s*$|[,;:\-–—/&+]\s*$/i;

function complete(max: number, description: string) {
  return z
    .string()
    .min(1)
    .max(max)
    .refine((value) => !DANGLING.test(value.trim()), {
      message:
        "This text stops mid-thought — it ends on a dangling word or punctuation. Rewrite it as a shorter COMPLETE phrase rather than running to the character limit.",
    })
    .describe(description);
}

const micro = z.string().min(1).max(24); // eyebrow / label — too short to dangle
const short = complete(38, "A heading as a complete phrase, not a truncated sentence.");
const line = complete(96, "One complete supporting sentence.");

/**
 * A display number, not a sentence. Descriptions here are load-bearing:
 * they are inlined into the JSON Schema sent to the model, and without them
 * it reliably fills stat tiles with prose ("Input → attention → logits")
 * that then fails the length check.
 */
const statValue = z
  .string()
  .min(1)
  .max(12)
  .describe('A short display number such as "40%", "$12M", "1.5B" or "48". Never a phrase.');

const statLabel = micro.describe(
  'What the number measures, 1-3 words, e.g. "Parameters" or "Context window".'
);

/**
 * For fields that hold a PHRASE rather than a label.
 *
 * At `micro`'s 24 characters the model reliably wrote to the limit and stopped
 * mid-thought — "LFP packs can cost about", "New cell lines start in". A label
 * fits in 24; a phrase does not, and a truncated phrase is worse than a short
 * one. 34 plus an explicit instruction fixes it.
 */
const phrase = complete(34, "A complete short phrase, 3-6 words. Never cut off mid-word or mid-thought.");

/* ------------------------------------------------------------------ */
/* Charts                                                              */
/* ------------------------------------------------------------------ */

const categoryPoint = z.object({ label: micro, value: z.number() });

/**
 * Chart types are keyed by the JOB the data does, not by what looks nice:
 * magnitude → column/bar, trend → line/area, part-to-whole → donut/waffle,
 * polarity → diverging, target → bullet, change → dumbbell, stages → funnel.
 */
export const ColumnChartSchema = z.object({
  kind: z.literal("column"),
  points: z.array(categoryPoint).min(2).max(7),
  /** index of the one bar that carries the story; the rest render gray */
  emphasisIndex: z.number().int().min(0).max(6).optional(),
  unit: z.string().max(6).optional(),
});

export const BarChartSchema = z.object({
  kind: z.literal("bar"),
  points: z.array(categoryPoint).min(2).max(6),
  unit: z.string().max(6).optional(),
});

/**
 * One axis, always. A line chart whose series live on different scales is a
 * dual-axis chart wearing a disguise: plotting revenue in millions (1.8-2.9)
 * beside subscribers in thousands (42-51) pins revenue flat against the
 * baseline and invents a relationship that isn't in the data.
 *
 * The refine is the enforcement, not the prompt — a rejected chart comes back
 * through the repair turn with this message, so the model fixes it itself.
 */
const SAME_SCALE_RATIO = 12;

export const LineChartSchema = z.object({
  kind: z.literal("line"),
  xLabels: z.array(z.string().max(10)).min(2).max(12),
  series: z
    .array(z.object({ name: micro, values: z.array(z.number()).min(2).max(12) }))
    .min(1)
    .max(3),
});

/**
 * The check itself lives here; it is applied on the generation schema below
 * rather than on LineChartSchema, because `.refine()` produces a ZodEffects
 * and Zod's discriminatedUnion only accepts plain ZodObjects.
 */
export function seriesShareOneAxis(chart: { kind: string; series?: { values: number[] }[] }) {
  if (chart.kind !== "line" || !chart.series) return true;
  const peaks = chart.series.map((s) => Math.max(...s.values.map(Math.abs))).filter((p) => p > 0);
  if (peaks.length < 2) return true;
  return Math.max(...peaks) / Math.min(...peaks) <= SAME_SCALE_RATIO;
}

export const AreaChartSchema = z.object({
  kind: z.literal("area"),
  xLabels: z.array(z.string().max(10)).min(2).max(12),
  values: z.array(z.number()).min(2).max(12),
});

export const DonutChartSchema = z.object({
  kind: z.literal("donut"),
  slices: z.array(categoryPoint).min(2).max(5),
  centerValue: statValue.optional(),
  centerLabel: micro.optional(),
});

export const WaffleChartSchema = z.object({
  kind: z.literal("waffle"),
  /** percent of the 100-cell grid that is filled */
  percent: z.number().min(0).max(100),
  caption: line.optional(),
});

export const DivergingChartSchema = z.object({
  kind: z.literal("diverging"),
  /** values may be negative — that is the whole point of this form */
  points: z.array(categoryPoint).min(2).max(6),
});

export const BulletChartSchema = z.object({
  kind: z.literal("bullet"),
  items: z
    .array(z.object({ label: micro, actual: z.number(), target: z.number() }))
    .min(1)
    .max(4),
});

export const DumbbellChartSchema = z.object({
  kind: z.literal("dumbbell"),
  beforeLabel: micro,
  afterLabel: micro,
  items: z
    .array(z.object({ label: micro, before: z.number(), after: z.number() }))
    .min(2)
    .max(5),
});

export const FunnelChartSchema = z.object({
  kind: z.literal("funnel"),
  stages: z.array(categoryPoint).min(3).max(5),
});

export const GanttChartSchema = z.object({
  kind: z.literal("gantt"),
  axisLabels: z.array(z.string().max(10)).min(2).max(6),
  /** start/end as 0-100 positions along the axis */
  lanes: z
    .array(
      z.object({
        label: micro,
        start: z.number().min(0).max(100),
        end: z.number().min(0).max(100),
      })
    )
    .min(2)
    .max(5),
});

export const ChartSpecSchema = z.discriminatedUnion("kind", [
  ColumnChartSchema,
  BarChartSchema,
  LineChartSchema,
  AreaChartSchema,
  DonutChartSchema,
  WaffleChartSchema,
  DivergingChartSchema,
  BulletChartSchema,
  DumbbellChartSchema,
  FunnelChartSchema,
  GanttChartSchema,
]);

export type ChartSpec = z.infer<typeof ChartSpecSchema>;
export type ChartKind = ChartSpec["kind"];

export const CHART_KINDS = [
  "column",
  "bar",
  "line",
  "area",
  "donut",
  "waffle",
  "diverging",
  "bullet",
  "dumbbell",
  "funnel",
  "gantt",
] as const satisfies readonly ChartKind[];

/* ------------------------------------------------------------------ */
/* Archetypes                                                          */
/* ------------------------------------------------------------------ */

const statTile = z.object({ label: statLabel, value: statValue });

export const HeroSlideSchema = z.object({
  archetype: z.literal("hero"),
  eyebrow: micro.optional(),
  title: complete(48, "The deck title as a complete phrase — never trail off."),
  subtitle: line,
  stats: z.array(statTile).length(2),
  footerLeft: micro.optional(),
  footerRight: micro.optional(),
});

export const StatGridSlideSchema = z.object({
  archetype: z.literal("statGrid"),
  leadLabel: micro,
  leadValue: statValue,
  leadNote: line,
  /** the supporting tiles around the anchor */
  stats: z.array(statTile).min(3).max(5),
});

export const QuadrantSlideSchema = z.object({
  archetype: z.literal("quadrant"),
  cells: z
    .array(z.object({ label: micro, heading: short, body: line }))
    .length(4),
});

export const FeatureGridSlideSchema = z.object({
  archetype: z.literal("featureGrid"),
  label: micro,
  statement: complete(84, "One complete sentence — the slide's single claim."),
  features: z.array(z.object({ heading: short })).length(4),
});

export const ChartSlideSchema = z.object({
  archetype: z.literal("chart"),
  label: micro,
  chart: ChartSpecSchema,
  /** the takeaway, not a description of the axes */
  takeaway: line.optional(),
  sideStats: z.array(statTile).max(2).optional(),
});

export const DiagramSlideSchema = z.object({
  archetype: z.literal("diagram"),
  label: micro,
  sets: z
    .array(z.object({ label: micro }))
    .min(2)
    .max(3)
    .describe("The 2-3 overlapping sets, each named in 1-3 words."),
  overlapLabel: micro.describe("What sits in the intersection, 1-3 words."),
  statement: complete(72, "One complete sentence about what the overlap means."),
  proof: statTile.optional().describe("One supporting number. Omit if there isn't a real one."),
});

export const ProcessSlideSchema = z.object({
  archetype: z.literal("process"),
  label: micro,
  meta: micro.optional().describe('Optional aside, e.g. "~4 hours end to end".'),
  steps: z
    .array(
      z.object({
        label: micro.describe('The step name, 1-2 words, e.g. "Tokenize".'),
        detail: phrase.describe('How it happens, 2-4 words, e.g. "Text → subword IDs".'),
      })
    )
    .min(3)
    .max(5),
  footnotes: z.array(z.string().min(1).max(34)).max(3).optional(),
});

/**
 * Three genuinely different timeline treatments — "series" plots milestones
 * against a real metric curve, "swimlane" shows duration and overlap, "rail"
 * is an aligned ledger. The plain three-boxes-in-a-row is deliberately absent.
 */
export const TimelineSlideSchema = z.object({
  archetype: z.literal("timeline"),
  variant: z.enum(["series", "swimlane", "rail"]),
  label: micro,
  milestones: z
    .array(z.object({ when: z.string().max(12), label: short, detail: phrase }))
    .min(3)
    .max(5),
  /** required by the "series" variant: the metric the milestones sit on */
  metric: z
    .object({ name: micro, values: z.array(z.number()).min(3).max(12) })
    .optional(),
  /** required by the "swimlane" variant */
  lanes: z
    .array(
      z.object({
        label: micro,
        start: z.number().min(0).max(100),
        end: z.number().min(0).max(100),
      })
    )
    .max(5)
    .optional(),
});

export const ComparisonSlideSchema = z.object({
  archetype: z.literal("comparison"),
  ours: z.object({
    label: micro,
    heading: short,
    points: z.array(phrase).min(2).max(4),
  }),
  theirs: z.object({
    label: micro,
    heading: short,
    points: z.array(phrase).min(2).max(3),
  }),
  proof: z.object({ label: micro, value: statValue, note: phrase }),
});

export const ClosingSlideSchema = z.object({
  archetype: z.literal("closing"),
  title: complete(48, "A complete closing line."),
  subtitle: line,
  cta: complete(36, 'The single next action, e.g. "Book a pilot" or "Read the paper".'),
  stats: z.array(statTile).max(2).optional().describe("At most two closing numbers. Omit if none."),
});

export const SlideSchema = z.discriminatedUnion("archetype", [
  HeroSlideSchema,
  StatGridSlideSchema,
  QuadrantSlideSchema,
  FeatureGridSlideSchema,
  ChartSlideSchema,
  DiagramSlideSchema,
  ProcessSlideSchema,
  TimelineSlideSchema,
  ComparisonSlideSchema,
  ClosingSlideSchema,
]);

export type Slide = z.infer<typeof SlideSchema>;
export type Archetype = Slide["archetype"];

export const ARCHETYPES = [
  "hero",
  "statGrid",
  "quadrant",
  "featureGrid",
  "chart",
  "diagram",
  "process",
  "timeline",
  "comparison",
  "closing",
] as const satisfies readonly Archetype[];

export const ArchetypeEnum = z.enum(ARCHETYPES);

/**
 * The chart slide as used for GENERATION: the plain object plus the one-axis
 * check. A rejection here comes back through the repair turn carrying this
 * message, so the model corrects the chart itself rather than us silently
 * shipping a misleading one. The plain `ChartSlideSchema` stays in the
 * discriminated union above, which Zod requires to hold only ZodObjects.
 */
export const ChartSlideGenerationSchema = ChartSlideSchema.refine(
  (slide) => seriesShareOneAxis(slide.chart),
  {
    message:
      "All series on a line chart share one axis, so they must be the same unit and a similar magnitude. These are not — plot only the measure this slide is about, or index every series to a common base (=100 at the first point).",
    path: ["chart", "series"],
  }
);

/** Per-archetype schemas, for one response_format per generation call. */
export const ARCHETYPE_SCHEMAS = {
  hero: HeroSlideSchema,
  statGrid: StatGridSlideSchema,
  quadrant: QuadrantSlideSchema,
  featureGrid: FeatureGridSlideSchema,
  chart: ChartSlideGenerationSchema,
  diagram: DiagramSlideSchema,
  process: ProcessSlideSchema,
  timeline: TimelineSlideSchema,
  comparison: ComparisonSlideSchema,
  closing: ClosingSlideSchema,
} as const satisfies Record<Archetype, z.ZodTypeAny>;
