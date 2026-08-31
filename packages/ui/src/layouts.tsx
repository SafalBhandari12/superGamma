import type {
  AgendaSlideSchema,
  BigStatSlideSchema,
  BulletsSlideSchema,
  ChartSlideSchema,
  ComparisonSlideSchema,
  ProcessSlideSchema,
  QuadrantSlideSchema,
  QuoteSlideSchema,
  TableSlideSchema,
  TeamSlideSchema,
  TimelineSlideSchema,
  TitleSlideSchema,
  TwoColumnSlideSchema,
} from "@supergamma/schema";
import type { z } from "zod";

/**
 * One component per catalog entry (packages/schema/src/slide.ts).
 * These are the ONLY layouts that exist — the model can't produce
 * anything these components don't already know how to render.
 *
 * Colors/fonts come from CSS custom properties set by DeckRenderer,
 * never hardcoded here — that's what makes theme-swapping free.
 *
 * Visual language is modeled directly on real consulting/business decks
 * (inspected live on Slidesgo — Corporate Strategy Consulting template
 * and others), not generic "SaaS card" styling or memory: generous white
 * space is the default, and accent color is spent sparingly — a numbered
 * badge, a thin rule, a corner block — never as a full-panel background
 * fill. Real decks let bold, hierarchical type do the organizing work;
 * tables use thin bordered grids with plain (unfilled) headers, not
 * solid-color header bars.
 */

/**
 * The model occasionally prefixes list items with its own "• " or "- "
 * even though the schema field is plain text — every list layout renders
 * its own marker, so a raw model-supplied one would double up visually.
 */
function stripListMarker(text: string): string {
  return text.replace(/^[\s•◦▪‣∙*-]+/, "");
}

/**
 * A deliberate 5-tier type scale, applied identically everywhere instead of
 * ad hoc per layout — that consistency is what makes hierarchy legible.
 * Every tier jumps in BOTH size and weight (never just one), since two
 * font-semibold headings of slightly different sizes still read as "the
 * same" — the weight jump is what actually separates tiers at a glance.
 *
 *   1. slideTitle  — title-layout headline only, the single biggest thing
 *      in the deck.
 *   2. heading     — every content slide's own title (H2). Same weight/size
 *      everywhere so the eye learns "this is where the slide's subject is."
 *   3. subheading  — item-level labels inside a slide (agenda item title,
 *      timeline step label, table header) — important, but subordinate to
 *      the slide heading.
 *   4. body        — the actual content (bullets, descriptions, cells).
 *      Deliberately regular weight, never competing with 2/3.
 *   5. meta        — captions, supporting text, footer — smallest, muted.
 */
const type = {
  slideTitle: "text-6xl font-extrabold tracking-tight leading-[1.05]",
  heading: "text-4xl font-bold tracking-tight",
  subheading: "text-xl font-bold",
  body: "text-lg font-normal",
  meta: "text-sm font-normal",
};

export function TitleLayout({
  slide,
}: {
  slide: z.infer<typeof TitleSlideSchema>;
}) {
  return (
    <div className="flex h-full w-full flex-col items-start justify-center px-16">
      <div className="mb-5 h-1.5 w-16" style={{ background: "var(--sg-accent)" }} />
      <h1
        className={`max-w-2xl ${type.slideTitle}`}
        style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
      >
        {slide.title}
      </h1>
      {slide.subtitle && (
        <p
          className={`mt-5 max-w-xl ${type.body}`}
          style={{ color: "var(--sg-muted)", fontFamily: "var(--sg-font-body)" }}
        >
          {slide.subtitle}
        </p>
      )}
    </div>
  );
}

export function BulletsLayout({
  slide,
}: {
  slide: z.infer<typeof BulletsSlideSchema>;
}) {
  return (
    <div className="flex h-full w-full flex-col justify-center px-16">
      <h2
        className={type.heading}
        style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
      >
        {slide.title}
      </h2>
      <div className="mt-7 flex flex-col">
        {slide.bullets.map((bullet: string, i: number) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b py-4 first:pt-0 last:border-b-0"
            style={{ borderColor: "color-mix(in srgb, var(--sg-muted) 20%, transparent)" }}
          >
            <span
              className={`shrink-0 tabular-nums ${type.subheading}`}
              style={{ color: "var(--sg-accent)", fontFamily: "var(--sg-font-heading)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className={`${type.body} leading-snug`}
              style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-body)" }}
            >
              {stripListMarker(bullet)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TwoColumnLayout({
  slide,
}: {
  slide: z.infer<typeof TwoColumnSlideSchema>;
}) {
  return (
    <div className="flex h-full w-full flex-col justify-center px-16">
      <h2
        className={type.heading}
        style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
      >
        {slide.title}
      </h2>
      <div className="mt-7 grid grid-cols-2 gap-10">
        {[slide.left, slide.right].map((col, colIdx) => (
          <div key={colIdx} className="border-l-4 pl-6" style={{ borderColor: "var(--sg-accent)" }}>
            <ul className="space-y-3">
              {col.map((item: string, i: number) => (
                <li
                  key={i}
                  className={`flex items-start gap-2.5 leading-snug ${type.body}`}
                  style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-body)" }}
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: "var(--sg-accent)" }}
                  />
                  <span>{stripListMarker(item)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BigStatLayout({
  slide,
}: {
  slide: z.infer<typeof BigStatSlideSchema>;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-16 text-center">
      <div
        className="text-9xl font-extrabold tracking-tight"
        style={{ color: "var(--sg-accent)", fontFamily: "var(--sg-font-heading)" }}
      >
        {slide.stat}
      </div>
      <div className="mt-5 h-1.5 w-16" style={{ background: "var(--sg-accent)" }} />
      <div
        className={`mt-6 ${type.subheading}`}
        style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-body)" }}
      >
        {slide.label}
      </div>
      {slide.supportingText && (
        <p
          className={`mt-4 max-w-xl ${type.meta}`}
          style={{ color: "var(--sg-muted)", fontFamily: "var(--sg-font-body)" }}
        >
          {slide.supportingText}
        </p>
      )}
    </div>
  );
}

export function QuoteLayout({
  slide,
}: {
  slide: z.infer<typeof QuoteSlideSchema>;
}) {
  return (
    <div className="flex h-full w-full items-center justify-center px-20">
      <div className="relative w-full max-w-2xl py-4 pl-14 pr-10">
        <div className="absolute left-0 top-2 bottom-2 w-1.5" style={{ background: "var(--sg-accent)" }} />
        <div
          className="mb-2 text-7xl font-serif leading-none"
          style={{ color: "var(--sg-accent)" }}
        >
          &ldquo;
        </div>
        <p
          className="text-3xl font-medium italic leading-relaxed"
          style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
        >
          {slide.quote}
        </p>
        {slide.attribution && (
          <p
            className={`mt-6 ${type.subheading}`}
            style={{ color: "var(--sg-accent)", fontFamily: "var(--sg-font-body)" }}
          >
            — {slide.attribution}
          </p>
        )}
      </div>
    </div>
  );
}

export function AgendaLayout({
  slide,
}: {
  slide: z.infer<typeof AgendaSlideSchema>;
}) {
  return (
    <div className="flex h-full w-full flex-col justify-center px-16">
      <h2
        className={type.heading}
        style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
      >
        {slide.title}
      </h2>
      <div className="mt-8 grid grid-cols-2 gap-x-10 gap-y-7">
        {slide.items.map((item, i) => (
          <div key={i} className="flex items-start gap-4">
            <span
              className="w-14 shrink-0 text-4xl font-extrabold leading-none tabular-nums"
              style={{ color: "var(--sg-accent)", fontFamily: "var(--sg-font-heading)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <div
                className={`${type.subheading} leading-snug`}
                style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
              >
                {item.title}
              </div>
              <div
                className={`mt-1 leading-snug ${type.meta}`}
                style={{ color: "var(--sg-muted)", fontFamily: "var(--sg-font-body)" }}
              >
                {item.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimelineLayout({
  slide,
}: {
  slide: z.infer<typeof TimelineSlideSchema>;
}) {
  return (
    <div className="flex h-full w-full flex-col justify-center px-16">
      <h2
        className={type.heading}
        style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
      >
        {slide.title}
      </h2>
      <div className="relative mt-14 flex items-start justify-between">
        <div
          className="absolute left-4 right-4 top-4 h-0.5"
          style={{ background: "color-mix(in srgb, var(--sg-muted) 30%, transparent)" }}
        />
        {slide.steps.map((step, i) => (
          <div key={i} className="relative z-10 flex w-full flex-col items-start pr-6 last:pr-0">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: "var(--sg-accent)", color: "var(--sg-background)" }}
            >
              {i + 1}
            </span>
            <div
              className={`mt-4 leading-snug ${type.subheading}`}
              style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
            >
              {step.label}
            </div>
            <div
              className={`mt-1 leading-snug ${type.meta}`}
              style={{ color: "var(--sg-muted)", fontFamily: "var(--sg-font-body)" }}
            >
              {step.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableLayout({
  slide,
}: {
  slide: z.infer<typeof TableSlideSchema>;
}) {
  return (
    <div className="flex h-full w-full flex-col justify-center px-16">
      <h2
        className={type.heading}
        style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
      >
        {slide.title}
      </h2>
      <div className="mt-7">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {slide.columns.map((col, i) => (
                <th
                  key={i}
                  className="border-b-2 px-4 py-3 text-left text-sm font-bold uppercase tracking-wide"
                  style={{
                    borderColor: "var(--sg-accent)",
                    color: "var(--sg-text)",
                    fontFamily: "var(--sg-font-heading)",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slide.rows.map((row, ri) => (
              <tr key={ri}>
                {slide.columns.map((_, ci) => (
                  <td
                    key={ci}
                    className="border-b px-4 py-3 text-base font-normal"
                    style={{
                      borderColor: "color-mix(in srgb, var(--sg-muted) 25%, transparent)",
                      color: "var(--sg-text)",
                      fontFamily: "var(--sg-font-body)",
                    }}
                  >
                    {row[ci] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const CHART_BAR_H = 168;

/**
 * Every chart series is a tint of the single theme accent, not an invented
 * multi-hue palette — real single-brand-color decks (finance/consulting)
 * use graduated tints of one color for chart series, which also guarantees
 * the chart never clashes with the rest of the deck's palette.
 */
function seriesTint(i: number, total: number): string {
  const pct = total <= 1 ? 90 : 55 + (i / (total - 1)) * 40;
  return `color-mix(in srgb, var(--sg-accent) ${Math.round(pct)}%, transparent)`;
}

export function ChartLayout({
  slide,
}: {
  slide: z.infer<typeof ChartSlideSchema>;
}) {
  return (
    <div className="flex h-full w-full flex-col justify-center px-16">
      <h2
        className={type.heading}
        style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
      >
        {slide.title}
      </h2>
      {slide.chartType === "bar" ? (
        <div className="mt-10 flex items-end gap-6">
          {(() => {
            const maxValue = Math.max(...slide.data.map((d) => d.value), 1);
            return slide.data.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <span
                  className={type.subheading}
                  style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
                >
                  {d.value}%
                </span>
                <div className="flex w-full items-end justify-center" style={{ height: CHART_BAR_H }}>
                  <div
                    className="w-full rounded-t-md"
                    style={{
                      height: Math.max((d.value / maxValue) * CHART_BAR_H, 6),
                      background: seriesTint(i, slide.data.length),
                    }}
                  />
                </div>
                <span
                  className={`${type.meta} text-center leading-snug`}
                  style={{ color: "var(--sg-muted)", fontFamily: "var(--sg-font-body)" }}
                >
                  {d.label}
                </span>
              </div>
            ));
          })()}
        </div>
      ) : (
        <div className="mt-8 flex items-center gap-14">
          <DonutRings data={slide.data} />
          <div className="flex flex-1 flex-col gap-3.5">
            {slide.data.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: seriesTint(i, slide.data.length) }}
                />
                <span
                  className={type.body}
                  style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-body)" }}
                >
                  {d.label}
                </span>
                <span
                  className={`ml-auto ${type.subheading}`}
                  style={{ color: "var(--sg-accent)", fontFamily: "var(--sg-font-heading)" }}
                >
                  {d.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DonutRings({ data }: { data: { label: string; value: number }[] }) {
  const size = 200;
  const center = size / 2;
  const strokeWidth = 15;
  const gap = 4;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {data.map((d, i) => {
        const r = center - strokeWidth / 2 - i * (strokeWidth + gap);
        if (r <= strokeWidth / 2) return null;
        const circumference = 2 * Math.PI * r;
        const dash = (d.value / 100) * circumference;
        return (
          <g key={i} transform={`rotate(-90 ${center} ${center})`}>
            <circle
              cx={center} cy={center} r={r} fill="none"
              stroke="color-mix(in srgb, var(--sg-muted) 15%, transparent)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={center} cy={center} r={r} fill="none"
              stroke={seriesTint(i, data.length)}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * "Poppins" -> "PP". Real people-grid slides use a photo; since this app
 * never generates images, a colored initials avatar is the honest
 * equivalent — plenty of real templates use exactly this fallback too.
 */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Pricing/comparison tiers — modeled on Slidesgo's "Pricing Table
 * Comparison Infographics": a graduated tint per tier header (same rank
 * -> opacity idea as chart series), a big price, and a feature list set
 * off by a thin divider rather than its own background block.
 */
export function ComparisonLayout({
  slide,
}: {
  slide: z.infer<typeof ComparisonSlideSchema>;
}) {
  const cols =
    slide.tiers.length === 2 ? "grid-cols-2" : slide.tiers.length === 3 ? "grid-cols-3" : "grid-cols-4";
  return (
    <div className="flex h-full w-full flex-col justify-center px-16">
      <h2
        className={type.heading}
        style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
      >
        {slide.title}
      </h2>
      <div className={`mt-7 grid gap-4 ${cols}`}>
        {slide.tiers.map((tier, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-md"
            style={{ border: "1px solid color-mix(in srgb, var(--sg-muted) 20%, transparent)" }}
          >
            <div
              className="px-3 py-2.5 text-center text-sm font-bold uppercase tracking-wide"
              style={{
                background: seriesTint(i, slide.tiers.length),
                color: "var(--sg-text)",
                fontFamily: "var(--sg-font-heading)",
              }}
            >
              {tier.name}
            </div>
            <div className="px-4 py-4">
              <div
                className={`font-extrabold ${type.subheading}`}
                style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
              >
                {tier.price}
              </div>
              <ul
                className="mt-3 flex flex-col gap-1.5 border-t pt-3"
                style={{ borderColor: "color-mix(in srgb, var(--sg-muted) 20%, transparent)" }}
              >
                {tier.features.map((f, fi) => (
                  <li
                    key={fi}
                    className={`${type.meta} leading-snug`}
                    style={{ color: "var(--sg-muted)", fontFamily: "var(--sg-font-body)" }}
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 2x2 strategic framework (SWOT and friends) — modeled directly on
 * Slidesgo's "Business SWOT Overview": a real cross-divider (built from
 * adjoining borders, not an absolutely-positioned line, so it always
 * lines up regardless of quadrant content height) with a labeled,
 * bulleted list in each cell.
 */
export function QuadrantLayout({
  slide,
}: {
  slide: z.infer<typeof QuadrantSlideSchema>;
}) {
  const quadrants = [slide.topLeft, slide.topRight, slide.bottomLeft, slide.bottomRight];
  const cellClasses = [
    "border-r border-b pr-8 pb-5",
    "border-b pl-8 pb-5",
    "border-r pr-8 pt-5",
    "pl-8 pt-5",
  ];
  return (
    <div className="flex h-full w-full flex-col justify-center px-16">
      <h2
        className={type.heading}
        style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
      >
        {slide.title}
      </h2>
      <div className="mt-7 grid grid-cols-2 grid-rows-2">
        {quadrants.map((q, i) => (
          <div
            key={i}
            className={`flex flex-col gap-1.5 ${cellClasses[i]}`}
            style={{ borderColor: "color-mix(in srgb, var(--sg-muted) 25%, transparent)" }}
          >
            <div
              className={type.subheading}
              style={{ color: "var(--sg-accent)", fontFamily: "var(--sg-font-heading)" }}
            >
              {q.label}
            </div>
            <ul className="flex flex-col gap-1">
              {q.items.map((item, ii) => (
                <li
                  key={ii}
                  className={`${type.meta} leading-snug`}
                  style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-body)" }}
                >
                  {stripListMarker(item)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Sequential chevron flow — modeled on Slidesgo's "Product Lifecycle
 * Infographics": overlapping arrow shapes reading as one continuous flow,
 * distinct from `timeline`'s circle-and-line convention. Best for short
 * single-phrase steps (no room for a description inside a chevron).
 */
export function ProcessLayout({
  slide,
}: {
  slide: z.infer<typeof ProcessSlideSchema>;
}) {
  return (
    <div className="flex h-full w-full flex-col justify-center px-16">
      <h2
        className={type.heading}
        style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
      >
        {slide.title}
      </h2>
      <div className="mt-10 flex">
        {slide.steps.map((step, i) => (
          <div
            key={i}
            className="flex h-16 flex-1 items-center justify-center text-center"
            style={{
              background: seriesTint(i, slide.steps.length),
              clipPath: "polygon(0% 0%, 80% 0%, 100% 50%, 80% 100%, 0% 100%, 18% 50%)",
              marginLeft: i === 0 ? 0 : "-9%",
            }}
          >
            <span
              className={`px-5 font-bold leading-tight ${type.body}`}
              style={{ color: "var(--sg-background)", fontFamily: "var(--sg-font-heading)" }}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * People grid — modeled on Slidesgo's "Team Org Charts Infographics",
 * minus the photo: this app never generates images, so a colored
 * initials avatar (a real, common fallback) stands in for the headshot.
 */
export function TeamLayout({
  slide,
}: {
  slide: z.infer<typeof TeamSlideSchema>;
}) {
  const cols = slide.members.length === 2 ? "grid-cols-2" : "grid-cols-3";
  return (
    <div className="flex h-full w-full flex-col justify-center px-16">
      <h2
        className={type.heading}
        style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
      >
        {slide.title}
      </h2>
      <div className={`mt-8 grid gap-x-6 gap-y-7 ${cols}`}>
        {slide.members.map((m, i) => (
          <div key={i} className="flex items-center gap-3">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold"
              style={{
                background: seriesTint(i, slide.members.length),
                color: "var(--sg-background)",
                fontFamily: "var(--sg-font-heading)",
              }}
            >
              {initials(m.name)}
            </span>
            <div className="min-w-0">
              <div
                className={`truncate ${type.subheading}`}
                style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
              >
                {m.name}
              </div>
              <div
                className={`truncate ${type.meta}`}
                style={{ color: "var(--sg-muted)", fontFamily: "var(--sg-font-body)" }}
              >
                {m.role}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
