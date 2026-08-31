import type { Slide } from "@supergamma/schema";
import {
  ChartSlide,
  ClosingSlide,
  ComparisonSlide,
  DiagramSlide,
  FeatureGridSlide,
  HeroSlide,
  ProcessSlide,
  QuadrantSlide,
  StatGridSlide,
  TimelineSlide,
} from "./archetypes.js";

/**
 * The only place that switches on `slide.archetype`. Adding an archetype means
 * adding a case here — the compiler enforces it, since `slide` is a
 * discriminated union and this switch is exhaustive.
 */
export function SlideRenderer({ slide }: { slide: Slide }) {
  return <div className="bento-slide">{renderArchetype(slide)}</div>;
}

function renderArchetype(slide: Slide) {
  switch (slide.archetype) {
    case "hero":
      return <HeroSlide slide={slide} />;
    case "statGrid":
      return <StatGridSlide slide={slide} />;
    case "quadrant":
      return <QuadrantSlide slide={slide} />;
    case "featureGrid":
      return <FeatureGridSlide slide={slide} />;
    case "chart":
      return <ChartSlide slide={slide} />;
    case "diagram":
      return <DiagramSlide slide={slide} />;
    case "process":
      return <ProcessSlide slide={slide} />;
    case "timeline":
      return <TimelineSlide slide={slide} />;
    case "comparison":
      return <ComparisonSlide slide={slide} />;
    case "closing":
      return <ClosingSlide slide={slide} />;
    default: {
      const _exhaustive: never = slide;
      return _exhaustive;
    }
  }
}
