import type { Deck, Slide } from "@supergamma/schema";

/**
 * Mirrors SlideRenderer's layout switch, but emits real PPTX shapes/text
 * boxes instead of DOM — a PPTX file isn't a picture of a slide, it's
 * structured XML, so this can't reuse the DOM renderer at all. Loaded
 * dynamically (only on click) since pptxgenjs is browser-only and has no
 * reason to sit in the initial bundle.
 */

const SLIDE_W = 10;
const SLIDE_H = 5.63;

function hex(color: string): string {
  return color.replace("#", "");
}

export async function exportDeckAsPptx(deck: Deck): Promise<void> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pptx: any = new PptxGenJS();
  pptx.defineLayout({ name: "SG_16x9", width: SLIDE_W, height: SLIDE_H });
  pptx.layout = "SG_16x9";

  const { colors, fonts } = deck.theme;
  const text = hex(colors.text);
  const accent = hex(colors.accent);
  const muted = hex(colors.muted);
  const background = hex(colors.background);

  for (const slide of deck.slides) {
    const pSlide = pptx.addSlide();
    pSlide.background = { color: background };
    pSlide.addShape("rect", { x: 0, y: 0, w: SLIDE_W, h: 0.08, fill: { color: accent } });

    addSlideContent(pSlide, slide, { text, accent, muted, background, headingFont: fonts.heading, bodyFont: fonts.body });
  }

  const fileName = (deck.title || "deck").trim().replace(/[^a-z0-9-_ ]/gi, "").slice(0, 60) || "deck";
  await pptx.writeFile({ fileName: `${fileName}.pptx` });
}

interface Palette {
  text: string;
  accent: string;
  muted: string;
  background: string;
  headingFont: string;
  bodyFont: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addSlideContent(pSlide: any, slide: Slide, p: Palette) {
  switch (slide.layout) {
    case "title": {
      pSlide.addText(slide.title, {
        x: 0.7, y: 2.0, w: 8.6, h: 1.3, fontSize: 36, bold: true,
        color: p.text, fontFace: p.headingFont, valign: "middle",
      });
      if (slide.subtitle) {
        pSlide.addText(slide.subtitle, {
          x: 0.7, y: 3.3, w: 8.6, h: 0.6, fontSize: 16,
          color: p.muted, fontFace: p.bodyFont,
        });
      }
      return;
    }
    case "bullets": {
      pSlide.addText(slide.title, {
        x: 0.7, y: 0.5, w: 8.6, h: 0.8, fontSize: 26, bold: true,
        color: p.text, fontFace: p.headingFont,
      });
      pSlide.addText(
        slide.bullets.map((b) => ({ text: b, options: { bullet: { code: "2022" }, color: p.accent } })),
        { x: 0.7, y: 1.6, w: 8.6, h: 3.6, fontSize: 16, color: p.text, fontFace: p.bodyFont, valign: "top", paraSpaceAfter: 12 }
      );
      return;
    }
    case "two-column": {
      pSlide.addText(slide.title, {
        x: 0.7, y: 0.5, w: 8.6, h: 0.8, fontSize: 26, bold: true,
        color: p.text, fontFace: p.headingFont,
      });
      pSlide.addText(
        slide.left.map((t) => ({ text: t, options: { bullet: { code: "2022" }, color: p.accent } })),
        { x: 0.7, y: 1.6, w: 4.1, h: 3.6, fontSize: 14, color: p.text, fontFace: p.bodyFont, valign: "top" }
      );
      pSlide.addText(
        slide.right.map((t) => ({ text: t, options: { bullet: { code: "2022" }, color: p.muted } })),
        { x: 5.2, y: 1.6, w: 4.1, h: 3.6, fontSize: 14, color: p.text, fontFace: p.bodyFont, valign: "top" }
      );
      return;
    }
    case "big-stat": {
      pSlide.addText(slide.stat, {
        x: 1, y: 1.7, w: 8, h: 1.5, fontSize: 60, bold: true,
        color: p.accent, fontFace: p.headingFont, align: "center",
      });
      pSlide.addText(slide.label, {
        x: 1, y: 3.2, w: 8, h: 0.6, fontSize: 20,
        color: p.text, fontFace: p.bodyFont, align: "center",
      });
      if (slide.supportingText) {
        pSlide.addText(slide.supportingText, {
          x: 1.5, y: 3.9, w: 7, h: 0.8, fontSize: 12,
          color: p.muted, fontFace: p.bodyFont, align: "center",
        });
      }
      return;
    }
    case "quote": {
      pSlide.addText(`"${slide.quote}"`, {
        x: 1, y: 1.7, w: 8, h: 2, fontSize: 24, italic: true,
        color: p.text, fontFace: p.headingFont, align: "center", valign: "middle",
      });
      if (slide.attribution) {
        pSlide.addText(`— ${slide.attribution}`, {
          x: 1, y: 3.8, w: 8, h: 0.5, fontSize: 14, bold: true,
          color: p.accent, fontFace: p.bodyFont, align: "center",
        });
      }
      return;
    }
    case "image-left": {
      pSlide.addShape("rect", { x: 0, y: 0, w: 5, h: SLIDE_H, fill: { color: p.muted } });
      pSlide.addText(slide.imagePrompt, {
        x: 0.4, y: 2.4, w: 4.2, h: 0.8, fontSize: 10,
        color: p.background, fontFace: p.bodyFont, align: "center", valign: "middle",
      });
      pSlide.addText(slide.title, {
        x: 5.4, y: 1.3, w: 4.2, h: 0.9, fontSize: 22, bold: true,
        color: p.text, fontFace: p.headingFont,
      });
      pSlide.addText(slide.body, {
        x: 5.4, y: 2.2, w: 4.2, h: 2.4, fontSize: 13,
        color: p.text, fontFace: p.bodyFont, valign: "top",
      });
      return;
    }
  }
}
