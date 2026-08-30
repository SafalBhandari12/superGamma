import type { Slide } from "@supergamma/schema";
import {
  BigStatLayout,
  BulletsLayout,
  ImageLeftLayout,
  QuoteLayout,
  TitleLayout,
  TwoColumnLayout,
} from "./layouts.js";

/**
 * The only place that switches on `slide.layout`. Adding a layout means
 * adding a case here — the compiler will complain if you forget, since
 * `slide` is a discriminated union and this switch is exhaustive.
 */
export function SlideRenderer({ slide }: { slide: Slide }) {
  switch (slide.layout) {
    case "title":
      return <TitleLayout slide={slide} />;
    case "bullets":
      return <BulletsLayout slide={slide} />;
    case "two-column":
      return <TwoColumnLayout slide={slide} />;
    case "big-stat":
      return <BigStatLayout slide={slide} />;
    case "quote":
      return <QuoteLayout slide={slide} />;
    case "image-left":
      return <ImageLeftLayout slide={slide} />;
    default: {
      const _exhaustive: never = slide;
      return _exhaustive;
    }
  }
}
