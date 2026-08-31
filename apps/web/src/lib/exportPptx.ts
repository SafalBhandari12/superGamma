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
      const startY = 1.5;
      slide.bullets.forEach((bullet, i) => {
        const y = startY + i * rowH;
        pSlide.addText(String(i + 1).padStart(2, "0"), {
          x: 0.7, y, w: 0.6, h: rowH, fontSize: 18, bold: true,
          color: p.accent, fontFace: p.headingFont, valign: "middle",
        });
        pSlide.addText(stripListMarker(bullet), {
          x: 1.4, y, w: 7.5, h: rowH, fontSize: 18,
          color: p.text, fontFace: p.bodyFont, valign: "middle",
        });
        if (i < slide.bullets.length - 1) {
          pSlide.addShape("line", {
            x: 0.7, y: y + rowH, w: 8.6, h: 0,
            line: { color: p.muted, width: 0.75, transparency: 70 },
          });
        }
      });
      return;
    }
    case "two-column": {
      pSlide.addText(slide.title, {
        x: 0.7, y: 0.45, w: 8.6, h: 0.7, fontSize: 32, bold: true,
        color: p.text, fontFace: p.headingFont,
      });
      const cols = [
        { items: slide.left, x: 0.7 },
        { items: slide.right, x: 5.15 },
      ];
      const cardY = 1.5;
      const cardW = 4.0;
      const cardH = 3.7;
      for (const col of cols) {
        pSlide.addShape("rect", {
          x: col.x, y: cardY, w: 0.045, h: cardH, fill: { color: p.accent }, line: { type: "none" },
        });
        pSlide.addText(
          col.items.map((t) => ({
            text: stripListMarker(t),
            options: { bullet: { code: "25CF", indent: 14 }, color: p.accent },
          })),
          {
            x: col.x + 0.3, y: cardY, w: cardW - 0.3, h: cardH, fontSize: 15,
            color: p.text, fontFace: p.bodyFont, valign: "top", paraSpaceAfter: 10,
          }
        );
      }
      return;
    }
    case "big-stat": {
      pSlide.addText(slide.stat, {
        x: 1.0, y: 1.1, w: 8.0, h: 1.9, fontSize: 72, bold: true,
        color: p.accent, fontFace: p.headingFont, align: "center", valign: "middle",
      });
      pSlide.addShape("rect", {
        x: 4.7, y: 3.05, w: 0.6, h: 0.06, fill: { color: p.accent }, line: { type: "none" },
      });
      pSlide.addText(slide.label, {
        x: 2.0, y: 3.25, w: 6.0, h: 0.6, fontSize: 20, bold: true,
        color: p.text, fontFace: p.bodyFont, align: "center", valign: "middle",
      });
      if (slide.supportingText) {
        pSlide.addText(slide.supportingText, {
          x: 1.7, y: 3.9, w: 6.6, h: 0.8, fontSize: 13,
          color: p.muted, fontFace: p.bodyFont, align: "center",
        });
      }
      return;
    }
    case "quote": {
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
        pSlide.addText(String(i + 1).padStart(2, "0"), {
          x, y: y - 0.08, w: 0.75, h: 0.55, fontSize: 28, bold: true,
          color: p.accent, fontFace: p.headingFont, valign: "top",
        });
        pSlide.addText(item.title, {
          x: x + 0.8, y: y - 0.05, w: colW - 0.85, h: 0.4, fontSize: 17, bold: true,
          color: p.text, fontFace: p.headingFont, valign: "top",
        });
        pSlide.addText(item.description, {
          x: x + 0.8, y: y + 0.35, w: colW - 0.85, h: 0.6, fontSize: 12,
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
      const thinBorder = { type: "solid", color: p.muted, pt: 0.75 };
      const accentBottom = { type: "solid", color: p.accent, pt: 1.5 };
      const headerRow = slide.columns.map((col) => ({
        text: col.toUpperCase(),
        options: {
          fill: { color: p.background }, color: p.text, bold: true,
          fontFace: p.headingFont, fontSize: 13, charSpacing: 1,
          border: [thinBorder, thinBorder, accentBottom, thinBorder],
        },
      }));
      const bodyRows = slide.rows.map((row) =>
        slide.columns.map((_, ci) => ({
          text: row[ci] ?? "",
          options: {
            fill: { color: p.background },
            color: p.text,
            fontFace: p.bodyFont,
            fontSize: 14,
            border: [thinBorder, thinBorder, thinBorder, thinBorder],
          },
        }))
      );
      pSlide.addTable([headerRow, ...bodyRows], {
        x: 0.7, y: 1.5, w: 8.6, h: 3.6,
        autoPage: false, valign: "middle",
      });
      return;
    }
    case "chart": {
      pSlide.addText(slide.title, {
        x: 0.7, y: 0.45, w: 8.6, h: 0.7, fontSize: 32, bold: true,
        color: p.text, fontFace: p.headingFont,
      });
      if (slide.chartType === "bar") {
        const n = slide.data.length;
        const maxValue = Math.max(...slide.data.map((d) => d.value), 1);
        const trackTop = 1.55;
        const trackH = 3.0;
        const baseline = trackTop + trackH;
        const colW = 8.6 / n;
        const barW = colW * 0.5;
        slide.data.forEach((d, i) => {
          const x = 0.7 + i * colW + (colW - barW) / 2;
          const barH = Math.max((d.value / maxValue) * trackH, 0.12);
          pSlide.addShape("roundRect", {
            x, y: baseline - barH, w: barW, h: barH, rectRadius: 0.05,
            fill: { color: p.accent, transparency: 100 - seriesOpacity(i, n) },
            line: { type: "none" },
          });
          pSlide.addText(`${d.value}%`, {
            x: 0.7 + i * colW, y: baseline - barH - 0.42, w: colW, h: 0.35, fontSize: 15, bold: true,
            color: p.text, fontFace: p.headingFont, align: "center",
          });
          pSlide.addText(d.label, {
            x: 0.7 + i * colW, y: baseline + 0.1, w: colW, h: 0.4, fontSize: 12,
            color: p.muted, fontFace: p.bodyFont, align: "center",
          });
        });
      } else {
        const n = slide.data.length;
        const cx = 2.4, cy = 3.15;
        const strokeW = 0.22, gap = 0.055;
        const r0 = 1.15;
        slide.data.forEach((d, i) => {
          const r = r0 - i * (strokeW + gap);
          if (r <= strokeW / 2) return;
          pSlide.addShape("blockArc", {
            x: cx - r, y: cy - r, w: r * 2, h: r * 2,
            angleRange: [0, 359.9], arcThicknessRatio: strokeW / r,
            fill: { color: p.muted, transparency: 85 }, line: { type: "none" },
          });
          pSlide.addShape("blockArc", {
            x: cx - r, y: cy - r, w: r * 2, h: r * 2,
            angleRange: [0, Math.max((d.value / 100) * 359.9, 2)], arcThicknessRatio: strokeW / r,
            fill: { color: p.accent, transparency: 100 - seriesOpacity(i, n) }, line: { type: "none" },
          });
        });
        const legendY = cy - r0;
        slide.data.forEach((d, i) => {
          const y = legendY + i * 0.55;
          pSlide.addShape("ellipse", {
            x: 4.1, y: y + 0.09, w: 0.16, h: 0.16,
            fill: { color: p.accent, transparency: 100 - seriesOpacity(i, n) }, line: { type: "none" },
          });
          pSlide.addText(d.label, {
            x: 4.4, y, w: 2.6, h: 0.35, fontSize: 14,
            color: p.text, fontFace: p.bodyFont, valign: "middle",
          });
          pSlide.addText(`${d.value}%`, {
            x: 7.0, y, w: 1.3, h: 0.35, fontSize: 15, bold: true,
            color: p.accent, fontFace: p.headingFont, align: "right", valign: "middle",
          });
        });
      }
      return;
    }
    case "comparison": {
      pSlide.addText(slide.title, {
        x: 0.7, y: 0.45, w: 8.6, h: 0.7, fontSize: 32, bold: true,
        color: p.text, fontFace: p.headingFont,
      });
      const n = slide.tiers.length;
      const gap = 0.25;
      const cardW = (8.6 - gap * (n - 1)) / n;
      const cardY = 1.5;
      const headerH = 0.5;
      const cardH = 3.6;
      slide.tiers.forEach((tier, i) => {
        const x = 0.7 + i * (cardW + gap);
        pSlide.addShape("rect", {
          x, y: cardY, w: cardW, h: cardH,
          fill: { color: p.background }, line: { color: p.muted, width: 0.75, transparency: 70 },
        });
        pSlide.addShape("rect", {
          x, y: cardY, w: cardW, h: headerH,
          fill: { color: p.accent, transparency: 100 - seriesOpacity(i, n) }, line: { type: "none" },
        });
        pSlide.addText(tier.name.toUpperCase(), {
          x, y: cardY, w: cardW, h: headerH, fontSize: 12, bold: true, charSpacing: 1,
          color: p.text, fontFace: p.headingFont, align: "center", valign: "middle",
        });
        pSlide.addText(tier.price, {
          x: x + 0.2, y: cardY + headerH + 0.15, w: cardW - 0.4, h: 0.5, fontSize: 20, bold: true,
          color: p.text, fontFace: p.headingFont, valign: "top",
        });
        pSlide.addShape("line", {
          x: x + 0.2, y: cardY + headerH + 0.75, w: cardW - 0.4, h: 0,
          line: { color: p.muted, width: 0.75, transparency: 70 },
        });
        pSlide.addText(
          tier.features.map((f) => ({
            text: f,
            options: { bullet: { code: "2022", indent: 10 }, breakLine: true },
          })),
          {
            x: x + 0.2, y: cardY + headerH + 0.9, w: cardW - 0.4, h: cardH - headerH - 1.0, fontSize: 11,
            color: p.muted, fontFace: p.bodyFont, valign: "top", lineSpacingMultiple: 1.3,
          }
        );
      });
      return;
    }
    case "quadrant": {
      pSlide.addText(slide.title, {
        x: 0.7, y: 0.45, w: 8.6, h: 0.7, fontSize: 32, bold: true,
        color: p.text, fontFace: p.headingFont,
      });
      const left = 0.7, top = 1.5, w = 8.6, h = 3.7;
      const midX = left + w / 2;
      const midY = top + h / 2;
      pSlide.addShape("line", {
        x: midX, y: top, w: 0, h, line: { color: p.muted, width: 1, transparency: 60 },
      });
      pSlide.addShape("line", {
        x: left, y: midY, w, h: 0, line: { color: p.muted, width: 1, transparency: 60 },
      });
      const cellW = w / 2 - 0.3;
      const cellH = h / 2 - 0.2;
      const quadrants = [
        { q: slide.topLeft, x: left, y: top },
        { q: slide.topRight, x: midX + 0.3, y: top },
        { q: slide.bottomLeft, x: left, y: midY + 0.2 },
        { q: slide.bottomRight, x: midX + 0.3, y: midY + 0.2 },
      ];
      quadrants.forEach(({ q, x, y }) => {
        pSlide.addText(q.label, {
          x, y, w: cellW, h: 0.35, fontSize: 16, bold: true,
          color: p.accent, fontFace: p.headingFont,
        });
        pSlide.addText(
          q.items.map((it) => ({
            text: stripListMarker(it),
            options: { bullet: { code: "2022", indent: 10 }, breakLine: true },
          })),
          {
            x, y: y + 0.4, w: cellW, h: cellH - 0.4, fontSize: 12,
            color: p.text, fontFace: p.bodyFont, valign: "top", lineSpacingMultiple: 1.25,
          }
        );
      });
      return;
    }
    case "process": {
      pSlide.addText(slide.title, {
        x: 0.7, y: 0.45, w: 8.6, h: 0.7, fontSize: 32, bold: true,
        color: p.text, fontFace: p.headingFont,
      });
      const n = slide.steps.length;
      const overlap = 0.35;
      const stepW = (8.6 + overlap * (n - 1)) / n;
      let x = 0.7;
      slide.steps.forEach((step, i) => {
        pSlide.addShape("chevron", {
          x, y: 2.3, w: stepW, h: 1.0,
          fill: { color: p.accent, transparency: 100 - seriesOpacity(i, n) }, line: { type: "none" },
        });
        pSlide.addText(step, {
          x, y: 2.3, w: stepW, h: 1.0, fontSize: 13, bold: true,
          color: p.background, fontFace: p.headingFont, align: "center", valign: "middle",
        });
        x += stepW - overlap;
      });
      return;
    }
    case "team": {
      pSlide.addText(slide.title, {
        x: 0.7, y: 0.45, w: 8.6, h: 0.7, fontSize: 32, bold: true,
        color: p.text, fontFace: p.headingFont,
      });
      const n = slide.members.length;
      const cols = n === 2 ? 2 : 3;
      const rows = Math.ceil(n / cols);
      const cellW = 8.6 / cols;
      const cellH = 3.6 / rows;
      slide.members.forEach((m, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 0.7 + col * cellW;
        const y = 1.6 + row * cellH;
        pSlide.addShape("ellipse", {
          x, y: y + 0.1, w: 0.55, h: 0.55,
          fill: { color: p.accent, transparency: 100 - seriesOpacity(i, n) }, line: { type: "none" },
        });
        pSlide.addText(initials(m.name), {
          x, y: y + 0.1, w: 0.55, h: 0.55, fontSize: 14, bold: true,
          color: p.background, fontFace: p.headingFont, align: "center", valign: "middle",
        });
        pSlide.addText(m.name, {
          x: x + 0.65, y: y + 0.08, w: cellW - 0.75, h: 0.32, fontSize: 14, bold: true,
          color: p.text, fontFace: p.headingFont, valign: "top",
        });
        pSlide.addText(m.role, {
          x: x + 0.65, y: y + 0.42, w: cellW - 0.75, h: 0.3, fontSize: 11,
          color: p.muted, fontFace: p.bodyFont, valign: "top",
        });
      });
      return;
    }
  }
}

/**
 * Mirrors layouts.tsx's seriesTint: every chart series is an opacity step
 * of the single theme accent (0-100), not an invented multi-hue palette.
 */
function seriesOpacity(i: number, total: number): number {
  return total <= 1 ? 90 : 55 + (i / (total - 1)) * 40;
}

/** Mirrors layouts.tsx's initials(): colored-initials avatar, no photo. */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
