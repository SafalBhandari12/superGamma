import type {
  BigStatSlideSchema,
  BulletsSlideSchema,
  ImageLeftSlideSchema,
  QuoteSlideSchema,
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
 */

export function TitleLayout({
  slide,
}: {
  slide: z.infer<typeof TitleSlideSchema>;
}) {
  return (
    <div className="flex h-full w-full flex-col items-start justify-center px-16">
      <h1
        className="text-5xl font-bold leading-tight"
        style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
      >
        {slide.title}
      </h1>
      {slide.subtitle && (
        <p
          className="mt-4 text-xl"
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
        className="text-3xl font-semibold"
        style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
      >
        {slide.title}
      </h2>
      <ul className="mt-8 space-y-4">
        {slide.bullets.map((bullet: string, i: number) => (
          <li
            key={i}
            className="flex items-start gap-3 text-lg"
            style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-body)" }}
          >
            <span style={{ color: "var(--sg-accent)" }}>&#9679;</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
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
        className="text-3xl font-semibold"
        style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
      >
        {slide.title}
      </h2>
      <div className="mt-8 grid grid-cols-2 gap-12">
        {[slide.left, slide.right].map((col, colIdx) => (
          <ul key={colIdx} className="space-y-3">
            {col.map((item: string, i: number) => (
              <li
                key={i}
                className="text-base"
                style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-body)" }}
              >
                {item}
              </li>
            ))}
          </ul>
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
        className="text-7xl font-bold"
        style={{ color: "var(--sg-accent)", fontFamily: "var(--sg-font-heading)" }}
      >
        {slide.stat}
      </div>
      <div
        className="mt-3 text-xl"
        style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-body)" }}
      >
        {slide.label}
      </div>
      {slide.supportingText && (
        <p
          className="mt-4 max-w-xl text-sm"
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
    <div className="flex h-full w-full flex-col items-center justify-center px-24 text-center">
      <p
        className="text-3xl italic leading-snug"
        style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
      >
        &ldquo;{slide.quote}&rdquo;
      </p>
      {slide.attribution && (
        <p
          className="mt-6 text-base"
          style={{ color: "var(--sg-muted)", fontFamily: "var(--sg-font-body)" }}
        >
          — {slide.attribution}
        </p>
      )}
    </div>
  );
}

export function ImageLeftLayout({
  slide,
}: {
  slide: z.infer<typeof ImageLeftSlideSchema>;
}) {
  return (
    <div className="grid h-full w-full grid-cols-2">
      <div
        className="flex items-center justify-center text-xs"
        style={{ background: "var(--sg-muted)", color: "var(--sg-background)" }}
      >
        {slide.imagePrompt}
      </div>
      <div className="flex flex-col justify-center px-12">
        <h2
          className="text-3xl font-semibold"
          style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-heading)" }}
        >
          {slide.title}
        </h2>
        <p
          className="mt-4 text-base"
          style={{ color: "var(--sg-text)", fontFamily: "var(--sg-font-body)" }}
        >
          {slide.body}
        </p>
      </div>
    </div>
  );
}
