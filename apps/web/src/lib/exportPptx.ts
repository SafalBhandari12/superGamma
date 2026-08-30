import type { Deck, Slide } from "@supergamma/schema";

/**
 * Mirrors SlideRenderer's layout switch, but emits real PPTX shapes/text
 * boxes instead of DOM — a PPTX file isn't a picture of a slide, it's
 * structured XML, so this can't reuse the DOM renderer at all. Loaded
 * dynamically (only on click) since pptxgenjs is browser-only and has no
 * reason to sit in the initial bundle.
 *
 * Visual language mirrors packages/ui/src/layouts.tsx, which is modeled
 * on real presentation templates rather than generic "SaaS card" styling:
 * FLAT solid-tint color blocks (no borders, no drop shadows, small/no
 * corner radius) and a fixed two-tone corner triangle repeated on every
 * slide as the one recurring brand motif. DOM has color-mix() for tints;
 * pptxgenjs shape fills need a literal hex, so `tint()` blends ahead of
 * time instead.
 */

const SLIDE_W = 10;
const SLIDE_H = 5.63;

function hex(color: string): string {
  return color.replace("#", "");
}

/**
 * The model occasionally prefixes list items with its own "• " or "- "
 * even though the schema field is plain text — every list layout renders
 * its own marker, so a raw model-supplied one would double up visually.
 */
function stripListMarker(text: string): string {
  return text.replace(/^[\s•◦▪‣∙*-]+/, "");
}

/** Blends `fgHex` into `bgHex` at `pct` opacity (0-1) — a precomputed color-mix(). */
function tint(fgHex: string, bgHex: string, pct: number): string {
  const fg = parseInt(fgHex, 16);
  const bg = parseInt(bgHex, 16);
  const mix = (shift: number) => {
    const f = (fg >> shift) & 255;
    const b = (bg >> shift) & 255;
    return Math.round(f * pct + b * (1 - pct));
  };
  return [mix(16), mix(8), mix(0)].map((v) => v.toString(16).padStart(2, "0")).join("");
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

  const palette: Palette = {
    text,
    accent,
    muted,
    background,
    headingFont: fonts.heading,
    bodyFont: fonts.body,
    accentTint: tint(accent, background, 0.08),
    mutedTint: tint(muted, background, 0.1),
  };

  deck.slides.forEach((slide, i) => {
    const pSlide = pptx.addSlide();
    pSlide.background = { color: background };

    // Signature corner accent — same fixed two-tone triangle on every
    // slide, the one recurring brand motif (mirrors DeckRenderer.tsx).
    pSlide.addShape("rtTriangle", {
      x: SLIDE_W - 1.7, y: 0, w: 1.7, h: 1.7, flipH: true,
      fill: { color: accent, transparency: 55 }, line: { type: "none" },
    });
    pSlide.addShape("rtTriangle", {
      x: SLIDE_W - 1.0, y: 0, w: 1.0, h: 1.0, flipH: true,
      fill: { color: accent }, line: { type: "none" },
    });

    addSlideContent(pSlide, slide, palette);

    pSlide.addText(deck.title, {
      x: 0.5, y: SLIDE_H - 0.38, w: 5, h: 0.3, fontSize: 8, bold: true, charSpacing: 1,
      color: palette.muted, fontFace: palette.bodyFont, valign: "middle",
    });
    pSlide.addText(
      `${String(i + 1).padStart(2, "0")} / ${String(deck.slides.length).padStart(2, "0")}`,
      {
        x: SLIDE_W - 1.4, y: SLIDE_H - 0.38, w: 0.9, h: 0.3, fontSize: 8, bold: true,
        color: palette.muted, fontFace: palette.bodyFont, align: "right", valign: "middle",
      }
    );
  });

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
  accentTint: string;
  mutedTint: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addSlideContent(pSlide: any, slide: Slide, p: Palette) {
  switch (slide.layout) {
    case "title": {
      pSlide.addShape("rect", { x: 0.7, y: 1.75, w: 0.55, h: 0.1, fill: { color: p.accent }, line: { type: "none" } });
      pSlide.addText(slide.title, {
        x: 0.7, y: 1.9, w: 8.0, h: 1.5, fontSize: 44, bold: true,
        color: p.text, fontFace: p.headingFont, valign: "middle",
      });
      if (slide.subtitle) {
        pSlide.addText(slide.subtitle, {
          x: 0.7, y: 3.4, w: 7.6, h: 0.6, fontSize: 18,
          color: p.muted, fontFace: p.bodyFont,
        });
      }
      return;
    }
    case "bullets": {
      pSlide.addText(slide.title, {
        x: 0.7, y: 0.45, w: 8.6, h: 0.7, fontSize: 32, bold: true,
        color: p.text, fontFace: p.headingFont,
      });
      const rowH = 0.62;
      const gap = 0.14;
      const startY = 1.45;
      slide.bullets.forEach((bullet, i) => {
        const y = startY + i * (rowH + gap);
        pSlide.addShape("roundRect", {
          x: 0.7, y, w: 8.6, h: rowH, rectRadius: 0.04,
          fill: { color: p.accentTint }, line: { type: "none" },
        });
        pSlide.addShape("roundRect", {
          x: 0.95, y: y + rowH / 2 - 0.19, w: 0.38, h: 0.38, rectRadius: 0.03,
          fill: { color: p.accent }, line: { type: "none" },
        });
        pSlide.addText(String(i + 1).padStart(2, "0"), {
          x: 0.95, y: y + rowH / 2 - 0.19, w: 0.38, h: 0.38, fontSize: 11, bold: true,
          color: p.background, fontFace: p.bodyFont, align: "center", valign: "middle",
        });
        pSlide.addText(stripListMarker(bullet), {
          x: 1.55, y, w: 7.5, h: rowH, fontSize: 18,
          color: p.text, fontFace: p.bodyFont, valign: "middle",
        });
      });
      return;
    }
    case "two-column": {
      pSlide.addText(slide.title, {
        x: 0.7, y: 0.45, w: 8.6, h: 0.7, fontSize: 32, bold: true,
        color: p.text, fontFace: p.headingFont,
      });
      const cols: { items: string[]; x: number; fill: string }[] = [
        { items: slide.left, x: 0.7, fill: p.accentTint },
        { items: slide.right, x: 5.15, fill: p.mutedTint },
      ];
      const cardY = 1.45;
      const cardW = 4.15;
      const cardH = 3.75;
      for (const col of cols) {
        pSlide.addShape("roundRect", {
          x: col.x, y: cardY, w: cardW, h: cardH, rectRadius: 0.04,
          fill: { color: col.fill }, line: { type: "none" },
        });
        pSlide.addShape("rect", {
          x: col.x + 0.35, y: cardY + 0.35, w: 0.45, h: 0.08, fill: { color: p.accent }, line: { type: "none" },
        });
        pSlide.addText(
          col.items.map((t) => ({
            text: stripListMarker(t),
            options: { bullet: { code: "25CF", indent: 14 }, color: p.accent },
          })),
          {
            x: col.x + 0.35, y: cardY + 0.7, w: cardW - 0.7, h: cardH - 1.0, fontSize: 15,
            color: p.text, fontFace: p.bodyFont, valign: "top", paraSpaceAfter: 8,
          }
        );
      }
      return;
    }
    case "big-stat": {
      pSlide.addShape("roundRect", {
        x: 2.3, y: 1.4, w: 5.4, h: 1.9, rectRadius: 0.05,
        fill: { color: p.accent }, line: { type: "none" },
      });
      pSlide.addText(slide.stat, {
        x: 2.3, y: 1.4, w: 5.4, h: 1.9, fontSize: 60, bold: true,
        color: p.background, fontFace: p.headingFont, align: "center", valign: "middle",
      });
      pSlide.addText(slide.label, {
        x: 2.0, y: 3.5, w: 6.0, h: 0.6, fontSize: 20, bold: true,
        color: p.text, fontFace: p.bodyFont, align: "center", valign: "middle",
      });
      if (slide.supportingText) {
        pSlide.addText(slide.supportingText, {
          x: 1.7, y: 4.15, w: 6.6, h: 0.8, fontSize: 13,
          color: p.muted, fontFace: p.bodyFont, align: "center",
        });
      }
      return;
    }
    case "quote": {
      pSlide.addShape("roundRect", {
        x: 1.2, y: 1.0, w: 7.6, h: 3.5, rectRadius: 0.04,
        fill: { color: p.accentTint }, line: { type: "none" },
      });
      pSlide.addShape("rect", { x: 1.2, y: 1.4, w: 0.08, h: 2.7, fill: { color: p.accent }, line: { type: "none" } });
      pSlide.addText(`"`, {
        x: 1.55, y: 1.1, w: 1.0, h: 0.9, fontSize: 54, bold: true,
        color: p.accent, fontFace: "Georgia", align: "left",
      });
      pSlide.addText(slide.quote, {
        x: 1.7, y: 1.95, w: 6.7, h: 1.6, fontSize: 24, italic: true,
        color: p.text, fontFace: p.headingFont, align: "center", valign: "top",
      });
      if (slide.attribution) {
        pSlide.addText(`— ${slide.attribution}`, {
          x: 1.7, y: 3.75, w: 6.7, h: 0.5, fontSize: 18, bold: true,
          color: p.accent, fontFace: p.bodyFont, align: "center",
        });
      }
      return;
    }
    case "agenda": {
      pSlide.addText(slide.title, {
        x: 0.7, y: 0.45, w: 8.6, h: 0.7, fontSize: 32, bold: true,
        color: p.text, fontFace: p.headingFont,
      });
      const cols = 2;
      const colW = 4.15;
      const rowH = 1.15;
      slide.items.forEach((item, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 0.7 + col * (colW + 0.3);
        const y = 1.5 + row * rowH;
        pSlide.addShape("roundRect", {
          x, y, w: 0.42, h: 0.42, rectRadius: 0.03,
          fill: { color: p.accent }, line: { type: "none" },
        });
        pSlide.addText(String(i + 1).padStart(2, "0"), {
          x, y, w: 0.42, h: 0.42, fontSize: 13, bold: true,
          color: p.background, fontFace: p.bodyFont, align: "center", valign: "middle",
        });
        pSlide.addText(item.title, {
          x: x + 0.55, y: y - 0.05, w: colW - 0.6, h: 0.4, fontSize: 17, bold: true,
          color: p.text, fontFace: p.headingFont, valign: "top",
        });
        pSlide.addText(item.description, {
          x: x + 0.55, y: y + 0.35, w: colW - 0.6, h: 0.6, fontSize: 12,
          color: p.muted, fontFace: p.bodyFont, valign: "top",
        });
      });
      return;
    }
    case "timeline": {
      pSlide.addText(slide.title, {
        x: 0.7, y: 0.45, w: 8.6, h: 0.7, fontSize: 32, bold: true,
        color: p.text, fontFace: p.headingFont,
      });
      const n = slide.steps.length;
      const trackY = 2.1;
      const colW = 8.6 / n;
      pSlide.addShape("line", {
        x: 0.95, y: trackY, w: 8.1, h: 0, line: { color: p.muted, width: 1, dashType: "solid", transparency: 60 },
      });
      slide.steps.forEach((step, i) => {
        const x = 0.7 + i * colW;
        pSlide.addShape("ellipse", {
          x: x + 0.05, y: trackY - 0.17, w: 0.34, h: 0.34, fill: { color: p.accent }, line: { type: "none" },
        });
        pSlide.addText(String(i + 1), {
          x: x + 0.05, y: trackY - 0.17, w: 0.34, h: 0.34, fontSize: 12, bold: true,
          color: p.background, fontFace: p.bodyFont, align: "center", valign: "middle",
        });
        pSlide.addText(step.label, {
          x, y: trackY + 0.35, w: colW - 0.25, h: 0.5, fontSize: 16, bold: true,
          color: p.text, fontFace: p.headingFont, valign: "top",
        });
        pSlide.addText(step.description, {
          x, y: trackY + 0.85, w: colW - 0.25, h: 1.2, fontSize: 12,
          color: p.muted, fontFace: p.bodyFont, valign: "top",
        });
      });
      return;
    }
    case "table": {
      pSlide.addText(slide.title, {
        x: 0.7, y: 0.45, w: 8.6, h: 0.7, fontSize: 32, bold: true,
        color: p.text, fontFace: p.headingFont,
      });
      const headerRow = slide.columns.map((col) => ({
        text: col.toUpperCase(),
        options: {
          fill: { color: p.accent }, color: p.background, bold: true,
          fontFace: p.headingFont, fontSize: 13, charSpacing: 1,
        },
      }));
      const bodyRows = slide.rows.map((row, ri) =>
        slide.columns.map((_, ci) => ({
          text: row[ci] ?? "",
          options: {
            fill: { color: ri % 2 === 0 ? p.accentTint : p.background },
            color: p.text,
            fontFace: p.bodyFont,
            fontSize: 14,
          },
        }))
      );
      pSlide.addTable([headerRow, ...bodyRows], {
        x: 0.7, y: 1.5, w: 8.6, h: 3.6,
        border: { type: "none" }, autoPage: false, valign: "middle",
      });
      return;
    }
  }
}
