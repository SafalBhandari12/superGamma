import type {
  AgendaSlideSchema,
  BigStatSlideSchema,
  BulletsSlideSchema,
  QuoteSlideSchema,
  TableSlideSchema,
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
 * Visual language is modeled on real presentation templates (Slidesgo
 * consulting/pitch-deck decks), not generic "SaaS card" styling: FLAT
 * solid-tint color blocks, no borders, no drop shadows, small/no corner
 * radius — professional decks signal structure with confident color
 * blocking, not soft glassy cards.
 */

const tintAccent = "color-mix(in srgb, var(--sg-accent) 8%, var(--sg-background))";
const tintMuted = "color-mix(in srgb, var(--sg-muted) 10%, var(--sg-background))";

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
      <div className="mt-7 flex flex-col gap-3">
        {slide.bullets.map((bullet: string, i: number) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-md px-5 py-3.5"
            style={{ background: tintAccent }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-base font-bold"
              style={{ background: "var(--sg-accent)", color: "var(--sg-background)" }}
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
      <div className="mt-7 grid grid-cols-2 gap-4">
        {[slide.left, slide.right].map((col, colIdx) => (
          <div
            key={colIdx}
            className="rounded-md p-6"
            style={{ background: colIdx === 0 ? tintAccent : tintMuted }}
          >
            <div className="mb-4 h-1.5 w-10" style={{ background: "var(--sg-accent)" }} />
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
      <div className="rounded-md px-14 py-8" style={{ background: "var(--sg-accent)" }}>
        <div
          className="text-8xl font-extrabold tracking-tight"
          style={{ color: "var(--sg-background)", fontFamily: "var(--sg-font-heading)" }}
        >
          {slide.stat}
        </div>
      </div>
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
      <div className="relative w-full max-w-2xl rounded-md py-12 pl-14 pr-10" style={{ background: tintAccent }}>
        <div className="absolute left-0 top-6 bottom-6 w-1.5" style={{ background: "var(--sg-accent)" }} />
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
      <div className="mt-8 grid grid-cols-2 gap-x-10 gap-y-6">
        {slide.items.map((item, i) => (
          <div key={i} className="flex items-start gap-4">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-base font-bold"
              style={{ background: "var(--sg-accent)", color: "var(--sg-background)" }}
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
      <div className="mt-7 overflow-hidden rounded-md">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {slide.columns.map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide"
                  style={{
                    background: "var(--sg-accent)",
                    color: "var(--sg-background)",
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
              <tr key={ri} style={{ background: ri % 2 === 0 ? tintAccent : "transparent" }}>
                {slide.columns.map((_, ci) => (
                  <td
                    key={ci}
                    className="px-4 py-3 text-base font-normal"
                    style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-body)" }}
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
