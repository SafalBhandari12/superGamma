import { z } from "zod";

/**
 * The bento archetype catalog. Same principle as the old layout catalog:
 * the model can only pick from shapes we have already made look good, and
 * every `.max()` here is the layout engine's capacity contract — a tile is
 * sized for content that fits inside these bounds.
 *
 * Length limits are TIGHTER than the old slide schema on purpose. Bento type
 * is set at presentation scale (body ~20pt, headings ~30pt), so a tile holds
 * roughly half the characters a web card would.
 */

const micro = z.string().min(1).max(24); // eyebrow / label
const short = z.string().min(1).max(38); // headings inside a tile
const line = z.string().min(1).max(96); // one supporting sentence
const statValue = z.string().min(1).max(10); // "40%", "$12M", "6.2M"

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

export const LineChartSchema = z.object({
  kind: z.literal("line"),
  xLabels: z.array(z.string().max(10)).min(2).max(12),
  series: z
    .array(z.object({ name: micro, values: z.array(z.number()).min(2).max(12) }))
    .min(1)
    .max(3),
});

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

const statTile = z.object({ label: micro, value: statValue });

export const HeroSlideSchema = z.object({
  archetype: z.literal("hero"),
  eyebrow: micro.optional(),
  title: z.string().min(1).max(48),
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
  statement: z.string().min(1).max(84),
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
  sets: z.array(z.object({ label: micro })).min(2).max(3),
  overlapLabel: micro,
  statement: z.string().min(1).max(60),
  proof: statTile.optional(),
});

export const ProcessSlideSchema = z.object({
  archetype: z.literal("process"),
  label: micro,
  meta: micro.optional(),
  steps: z.array(z.object({ label: micro, detail: micro })).min(3).max(5),
  footnotes: z.array(micro).max(3).optional(),
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
    .array(z.object({ when: z.string().max(12), label: short, detail: micro }))
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
    points: z.array(micro).min(2).max(4),
  }),
  theirs: z.object({
    label: micro,
    heading: short,
    points: z.array(micro).min(2).max(3),
  }),
  proof: z.object({ label: micro, value: statValue, note: micro }),
});

export const ClosingSlideSchema = z.object({
  archetype: z.literal("closing"),
  title: z.string().min(1).max(48),
  subtitle: line,
  cta: micro,
  stats: z.array(statTile).max(2).optional(),
});

export const BentoSlideSchema = z.discriminatedUnion("archetype", [
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

export type BentoSlide = z.infer<typeof BentoSlideSchema>;
export type BentoArchetype = BentoSlide["archetype"];

export const BENTO_ARCHETYPES = [
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
] as const satisfies readonly BentoArchetype[];

export const BentoArchetypeEnum = z.enum(BENTO_ARCHETYPES);

/** Per-archetype schemas, for one response_format per generation call. */
export const BENTO_ARCHETYPE_SCHEMAS = {
  hero: HeroSlideSchema,
  statGrid: StatGridSlideSchema,
  quadrant: QuadrantSlideSchema,
  featureGrid: FeatureGridSlideSchema,
  chart: ChartSlideSchema,
  diagram: DiagramSlideSchema,
  process: ProcessSlideSchema,
  timeline: TimelineSlideSchema,
  comparison: ComparisonSlideSchema,
  closing: ClosingSlideSchema,
} as const satisfies Record<BentoArchetype, z.ZodTypeAny>;
