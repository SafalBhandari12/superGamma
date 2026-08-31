import type { ChartSpec, Deck, GridTile, Slide, Theme } from "@supergamma/schema";
import { RADIUS, SLIDE_H, SLIDE_W, tileRect, tilesFor } from "@supergamma/schema";

/**
 * PPTX export.
 *
 * A pptx is structured XML, not a picture of a slide, so this cannot reuse the
 * DOM renderer. What it CAN reuse — and does — is the layout: `tilesFor()` and
 * `tileRect()` are the same functions the React renderer calls, so the exported
 * file and the on-screen preview place every tile identically by construction.
 * Only the drawing differs.
 *
 * pptxgenjs is browser-only and heavy, so it is imported dynamically on click.
 */

const PAD = 0.17; // inner padding, inches
const LINE = 0.02;

function hex(color: string): string {
  return color.replace("#", "").slice(0, 6);
}

/** Blend two hex colours — pptx fills need a literal, there is no color-mix(). */
function blend(a: string, b: string, ratio: number): string {
  const pa = hex(a);
  const pb = hex(b);
  const mix = (i: number) => {
    const va = parseInt(pa.slice(i, i + 2), 16);
    const vb = parseInt(pb.slice(i, i + 2), 16);
    return Math.round(va + (vb - va) * ratio)
      .toString(16)
      .padStart(2, "0");
  };
  return `${mix(0)}${mix(2)}${mix(4)}`;
}

interface Palette {
  canvas: string;
  s1: string;
  s2: string;
  s3: string;
  text: string;
  muted: string;
  tones: string[];
  onTone: string;
  series: string[];
  positive: string;
  negative: string;
  border: string;
  mesh: string;
}

function palette(theme: Theme): Palette {
  const c = theme.colors;
  const tones = c.tones.map(hex);
  // The mesh is three radial nodes in the browser; pptx has no equivalent, so
  // approximate it as its dominant node washed into the surface it sits on.
  const mesh = blend(c.surface2, c.tones[theme.meshTones[0]] ?? c.tones[0], 0.16);
  return {
    canvas: hex(c.canvas),
    s1: hex(c.surface1),
    s2: hex(c.surface2),
    s3: hex(c.surface3),
    text: hex(c.text),
    muted: hex(c.muted),
    tones,
    onTone: hex(c.onTone),
    series: c.series.map(hex),
    positive: hex(c.positive),
    negative: hex(c.negative),
    border: blend(c.surface1, c.text, theme.mode === "dark" ? 0.12 : 0.1),
    mesh,
  };
}

function surfaceFill(surface: GridTile["surface"], p: Palette): string {
  switch (surface) {
    case "mesh":
      return p.mesh;
    case "s2":
      return p.s2;
    case "s3":
      return p.s3;
    case "tone1":
      return p.tones[0];
    case "tone2":
      return p.tones[1];
    case "tone3":
      return p.tones[2];
    case "tone4":
      return p.tones[3];
    case "tone5":
      return p.tones[4];
    default:
      return p.s1;
  }
}

const isTone = (surface: string) => surface.startsWith("tone");

/** Type ramp in points. The slide is 10in wide, so these are true slide sizes. */
const TYPE = {
  label: 10,
  body: 13,
  listItem: 13,
  heading: 18,
  statement: 21,
  stat: 30,
  statXl: 54,
  title: 34,
  subtitle: 14,
} as const;

type Ctx = {
  slide: any;
  p: Palette;
  tile: GridTile;
  rect: { x: number; y: number; w: number; h: number };
  ink: string;
  dim: string;
};

/**
 * Stack text blocks down a tile from a starting offset, returning the next free
 * y. Keeping placement in one helper is what stops tiles overflowing: every
 * block declares its own height rather than relying on autofit.
 */
function stack(ctx: Ctx) {
  let y = ctx.rect.y + PAD;
  const x = ctx.rect.x + PAD;
  const w = ctx.rect.w - PAD * 2;
  const bottom = ctx.rect.y + ctx.rect.h - PAD;

  return {
    add(
      text: string,
      opts: { size: number; bold?: boolean; color?: string; height?: number; caps?: boolean }
    ) {
      if (!text) return;
      const h = opts.height ?? opts.size / 72 + 0.1;
      if (y + h > bottom + 0.05) return; // never draw past the tile
      ctx.slide.addText(opts.caps ? text.toUpperCase() : text, {
        x,
        y,
        w,
        h,
        fontSize: opts.size,
        bold: opts.bold,
        color: opts.color ?? ctx.ink,
        charSpacing: opts.caps ? 1.2 : 0,
        valign: "top",
        align: "left",
      });
      y += h + 0.04;
    },
    push(delta: number) {
      y += delta;
    },
    toBottom(height: number) {
      y = Math.max(y, bottom - height);
    },
    get cursor() {
      return y;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Charts                                                              */
/* ------------------------------------------------------------------ */

/**
 * Five chart kinds map onto native PowerPoint charts, which stay editable in
 * the deck. The rest have no native equivalent and are drawn as shapes.
 */
function drawChart(slide: any, chart: ChartSpec, r: { x: number; y: number; w: number; h: number }, p: Palette, onTone: boolean) {
  const box = { x: r.x + PAD, y: r.y + PAD + 0.28, w: r.w - PAD * 2, h: r.h - PAD * 2 - 0.3 };
  const ink = onTone ? p.onTone : p.text;
  const dim = onTone ? p.onTone : p.muted;
  const bar = onTone ? p.onTone : p.tones[0];

  const common = {
    ...box,
    showLegend: false,
    showValue: false,
    catAxisLabelColor: dim,
    valAxisLabelColor: dim,
    catAxisLabelFontSize: 9,
    valAxisLabelFontSize: 9,
    valGridLine: { style: "none" as const },
    catGridLine: { style: "none" as const },
    chartColors: p.series,
  };

  switch (chart.kind) {
    case "column":
    case "bar": {
      const emphasis = chart.kind === "column" ? chart.emphasisIndex : undefined;
      slide.addChart(chart.kind === "bar" ? "bar" : "bar", {
        ...common,
        barDir: chart.kind === "bar" ? "bar" : "col",
        chartColors:
          emphasis === undefined
            ? chart.points.map(() => bar)
            : chart.points.map((_, i) => (i === emphasis ? bar : blend(p.s2, p.muted, 0.5))),
        showValue: true,
        dataLabelColor: ink,
        dataLabelFontSize: 9,
        barGapWidthPct: 120,
      }, [
        {
          name: "Value",
          labels: chart.points.map((pt) => pt.label),
          values: chart.points.map((pt) => pt.value),
        },
      ]);
      return;
    }
    case "line":
    case "area": {
      const series =
        chart.kind === "line"
          ? chart.series.map((s) => ({ name: s.name, labels: chart.xLabels, values: s.values }))
          : [{ name: "Value", labels: chart.xLabels, values: chart.values }];
      slide.addChart(chart.kind === "area" ? "area" : "line", {
        ...common,
        showLegend: chart.kind === "line" && chart.series.length > 1,
        legendPos: "b",
        legendColor: dim,
        legendFontSize: 9,
        lineSize: 2,
        lineSmooth: false,
        chartColors: chart.kind === "area" ? [bar] : p.series,
      }, series);
      return;
    }
    case "donut": {
      slide.addChart("doughnut", {
        ...box,
        holeSize: 55,
        showLegend: true,
        legendPos: "b",
        legendColor: dim,
        legendFontSize: 9,
        chartColors: p.series,
        dataBorder: { pt: 1, color: onTone ? hex("#ffffff") : p.s1 },
      }, [
        {
          name: "Share",
          labels: chart.slices.map((s) => s.label),
          values: chart.slices.map((s) => s.value),
        },
      ]);
      return;
    }
    case "waffle": {
      const filled = Math.round(chart.percent);
      const cell = Math.min(box.w / 14, box.h / 11);
      const originX = box.x + (box.w - cell * 9.6) / 2;
      for (let i = 0; i < 100; i++) {
        slide.addShape("roundRect", {
          x: originX + (i % 10) * cell,
          y: box.y + Math.floor(i / 10) * cell,
          w: cell * 0.72,
          h: cell * 0.72,
          rectRadius: 0.02,
          fill: { color: i < filled ? bar : blend(p.s2, p.muted, 0.35) },
          line: { type: "none" },
        });
      }
      return;
    }
    case "diverging": {
      const max = Math.max(...chart.points.map((pt) => Math.abs(pt.value)), 1) * 1.15;
      const rowH = box.h / chart.points.length;
      const mid = box.x + box.w * 0.55;
      chart.points.forEach((pt, i) => {
        const w = (Math.abs(pt.value) / max) * (box.w * 0.4);
        const positive = pt.value >= 0;
        slide.addText(pt.label, {
          x: box.x,
          y: box.y + rowH * i,
          w: box.w * 0.5,
          h: rowH * 0.5,
          fontSize: 10,
          color: dim,
        });
        slide.addShape("roundRect", {
          x: positive ? mid : mid - w,
          y: box.y + rowH * i + rowH * 0.12,
          w: Math.max(w, 0.03),
          h: Math.min(rowH * 0.5, 0.24),
          rectRadius: 0.04,
          fill: { color: positive ? p.positive : p.negative },
          line: { type: "none" },
        });
      });
      return;
    }
    case "bullet": {
      const rowH = box.h / chart.items.length;
      chart.items.forEach((item, i) => {
        const scale = Math.max(item.actual, item.target) * 1.15 || 1;
        const y = box.y + rowH * i;
        slide.addText(item.label, { x: box.x, y, w: box.w, h: rowH * 0.4, fontSize: 10, color: dim });
        slide.addShape("roundRect", {
          x: box.x,
          y: y + rowH * 0.42,
          w: box.w,
          h: Math.min(rowH * 0.34, 0.2),
          rectRadius: 0.04,
          fill: { color: blend(p.s2, p.muted, 0.3) },
          line: { type: "none" },
        });
        slide.addShape("roundRect", {
          x: box.x,
          y: y + rowH * 0.42,
          w: box.w * (item.actual / scale),
          h: Math.min(rowH * 0.34, 0.2),
          rectRadius: 0.04,
          fill: { color: bar },
          line: { type: "none" },
        });
        slide.addShape("line", {
          x: box.x + box.w * (item.target / scale),
          y: y + rowH * 0.36,
          w: 0,
          h: Math.min(rowH * 0.46, 0.28),
          line: { color: ink, width: 2 },
        });
      });
      return;
    }
    case "dumbbell": {
      const max = Math.max(...chart.items.flatMap((i) => [i.before, i.after]), 1) * 1.15;
      const rowH = box.h / chart.items.length;
      const trackX = box.x + box.w * 0.3;
      const trackW = box.w * 0.66;
      chart.items.forEach((item, i) => {
        const y = box.y + rowH * i + rowH * 0.4;
        const x1 = trackX + (item.before / max) * trackW;
        const x2 = trackX + (item.after / max) * trackW;
        slide.addText(item.label, { x: box.x, y: y - 0.12, w: box.w * 0.28, h: 0.24, fontSize: 10, color: dim });
        slide.addShape("line", {
          x: Math.min(x1, x2),
          y,
          w: Math.abs(x2 - x1),
          h: 0,
          line: { color: blend(p.s2, p.muted, 0.45), width: 2 },
        });
        slide.addShape("ellipse", { x: x1 - 0.05, y: y - 0.05, w: 0.1, h: 0.1, fill: { color: p.muted }, line: { type: "none" } });
        slide.addShape("ellipse", { x: x2 - 0.05, y: y - 0.05, w: 0.1, h: 0.1, fill: { color: bar }, line: { type: "none" } });
      });
      return;
    }
    case "funnel": {
      const rowH = box.h / chart.stages.length;
      const top = chart.stages[0]?.value || 1;
      chart.stages.forEach((s, i) => {
        const w = Math.max((s.value / top) * box.w, box.w * 0.25);
        slide.addShape("roundRect", {
          x: box.x + (box.w - w) / 2,
          y: box.y + rowH * i,
          w,
          h: rowH * 0.76,
          rectRadius: 0.04,
          fill: { color: bar, transparency: i * 16 },
          line: { type: "none" },
        });
        slide.addText(`${s.label} · ${s.value}`, {
          x: box.x,
          y: box.y + rowH * i,
          w: box.w,
          h: rowH * 0.76,
          fontSize: 10,
          bold: true,
          align: "center",
          valign: "middle",
          color: p.onTone,
        });
      });
      return;
    }
    case "gantt": {
      const rowH = box.h / chart.lanes.length;
      const trackX = box.x + box.w * 0.26;
      const trackW = box.w * 0.72;
      chart.lanes.forEach((lane, i) => {
        const x1 = trackX + (Math.min(lane.start, lane.end) / 100) * trackW;
        const x2 = trackX + (Math.max(lane.start, lane.end) / 100) * trackW;
        slide.addText(lane.label, { x: box.x, y: box.y + rowH * i, w: box.w * 0.24, h: rowH * 0.7, fontSize: 10, color: dim });
        slide.addShape("roundRect", {
          x: x1,
          y: box.y + rowH * i + rowH * 0.12,
          w: Math.max(x2 - x1, 0.06),
          h: Math.min(rowH * 0.5, 0.26),
          rectRadius: 0.05,
          fill: { color: p.series[i % 3] },
          line: { type: "none" },
        });
      });
      return;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Slide emit                                                          */
/* ------------------------------------------------------------------ */

function emitTile(pSlide: any, tile: GridTile, p: Palette): Ctx {
  const rect = tileRect(tile);
  const tone = isTone(tile.surface);
  pSlide.addShape("roundRect", {
    ...rect,
    rectRadius: RADIUS,
    fill: { color: surfaceFill(tile.surface, p) },
    line: tone || tile.surface === "mesh" ? { type: "none" } : { color: p.border, width: LINE * 72 },
  });
  return {
    slide: pSlide,
    p,
    tile,
    rect,
    ink: tone ? p.onTone : p.text,
    dim: tone ? p.onTone : p.muted,
  };
}

function fill(pSlide: any, slide: Slide, p: Palette) {
  const tiles = tilesFor(slide);
  const ctxOf = (id: string) => {
    const tile = tiles.find((t) => t.id === id);
    return tile ? emitTile(pSlide, tile, p) : undefined;
  };

  switch (slide.archetype) {
    case "hero": {
      const a = ctxOf("anchor");
      if (a) {
        const s = stack(a);
        if (slide.eyebrow) s.add(slide.eyebrow, { size: TYPE.label, color: a.dim, caps: true, height: 0.22 });
        s.toBottom(1.5);
        s.add(slide.title, { size: TYPE.title, bold: true, height: 0.95 });
        s.add(slide.subtitle, { size: TYPE.subtitle, color: a.dim, height: 0.4 });
      }
      slide.stats.forEach((stat, i) => {
        const c = ctxOf(`stat${i}`);
        if (!c) return;
        const s = stack(c);
        s.push(0.12);
        s.add(stat.label, { size: TYPE.label, color: c.dim, caps: true, height: 0.22 });
        s.add(stat.value, { size: TYPE.stat, bold: true, height: 0.55 });
      });
      const f = ctxOf("footer");
      if (f) {
        pSlide.addText(slide.footerLeft ?? "", {
          x: f.rect.x + PAD, y: f.rect.y, w: f.rect.w / 2, h: f.rect.h, fontSize: 10, color: f.dim, valign: "middle",
        });
        pSlide.addText(slide.footerRight ?? "", {
          x: f.rect.x + f.rect.w / 2 - PAD, y: f.rect.y, w: f.rect.w / 2, h: f.rect.h, fontSize: 10, color: f.dim, valign: "middle", align: "right",
        });
      }
      return;
    }

    case "statGrid": {
      const lead = ctxOf("lead");
      if (lead) {
        const s = stack(lead);
        s.add(slide.leadLabel, { size: TYPE.label, color: lead.dim, caps: true, height: 0.22 });
        s.toBottom(1.35);
        s.add(slide.leadValue, { size: TYPE.statXl, bold: true, height: 0.9 });
        s.add(slide.leadNote, { size: TYPE.body, color: lead.dim, height: 0.32 });
      }
      slide.stats.forEach((stat, i) => {
        const c = ctxOf(`stat${i}`);
        if (!c) return;
        const s = stack(c);
        s.push(0.08);
        s.add(stat.label, { size: TYPE.label, color: c.dim, caps: true, height: 0.2 });
        s.add(stat.value, { size: TYPE.stat, bold: true, height: 0.5 });
      });
      return;
    }

    case "quadrant": {
      slide.cells.forEach((cell, i) => {
        const c = ctxOf(`cell${i}`);
        if (!c) return;
        const s = stack(c);
        s.add(cell.label, { size: TYPE.label, color: c.dim, caps: true, height: 0.2 });
        s.add(cell.heading, { size: TYPE.heading, bold: true, height: 0.34 });
        s.add(cell.body, { size: TYPE.body, color: c.dim, height: 0.62 });
      });
      return;
    }

    case "featureGrid": {
      const a = ctxOf("anchor");
      if (a) {
        const s = stack(a);
        s.add(slide.label, { size: TYPE.label, color: a.dim, caps: true, height: 0.22 });
        s.push(0.06);
        s.add(slide.statement, { size: TYPE.statement, bold: true, height: 1.1 });
      }
      slide.features.forEach((feature, i) => {
        const c = ctxOf(`feature${i}`);
        if (!c) return;
        const s = stack(c);
        s.push(0.1);
        s.add(String(i + 1).padStart(2, "0"), { size: TYPE.label, color: c.dim, height: 0.2 });
        s.add(feature.heading, { size: TYPE.heading, bold: true, height: 0.6 });
      });
      return;
    }

    case "chart": {
      const c = ctxOf("chart");
      if (c) {
        pSlide.addText(slide.label.toUpperCase(), {
          x: c.rect.x + PAD, y: c.rect.y + PAD, w: c.rect.w - PAD * 2, h: 0.22,
          fontSize: TYPE.label, color: c.dim, charSpacing: 1.2,
        });
        drawChart(pSlide, slide.chart, c.rect, p, isTone(c.tile.surface));
      }
      (slide.sideStats ?? []).forEach((stat, i) => {
        const sc = ctxOf(`side${i}`);
        if (!sc) return;
        const s = stack(sc);
        s.push(0.1);
        s.add(stat.label, { size: TYPE.label, color: sc.dim, caps: true, height: 0.2 });
        s.add(stat.value, { size: TYPE.stat, bold: true, height: 0.5 });
      });
      const t = ctxOf("takeaway");
      if (t && slide.takeaway) {
        pSlide.addText(slide.takeaway, {
          x: t.rect.x + PAD, y: t.rect.y, w: t.rect.w - PAD * 2, h: t.rect.h,
          fontSize: TYPE.body, color: t.ink, valign: "middle",
        });
      }
      return;
    }

    case "diagram": {
      const d = ctxOf("diagram");
      if (d) {
        pSlide.addText(slide.label.toUpperCase(), {
          x: d.rect.x + PAD, y: d.rect.y + PAD, w: d.rect.w - PAD * 2, h: 0.22,
          fontSize: TYPE.label, color: d.dim, charSpacing: 1.2,
        });
        // Overlapping translucent circles — the same construction as the DOM
        // venn, with transparency standing in for fill-opacity.
        const three = slide.sets.length >= 3;
        const size = Math.min(d.rect.w * 0.56, d.rect.h * 0.44);
        const cx = d.rect.x + d.rect.w / 2;
        const cy = d.rect.y + d.rect.h * 0.46;
        const off = size * 0.28;
        const spots = three
          ? [
              { x: cx - off - size / 2, y: cy - off - size / 2 },
              { x: cx + off - size / 2, y: cy - off - size / 2 },
              { x: cx - size / 2, y: cy + off - size / 2 },
            ]
          : [
              { x: cx - off - size / 2, y: cy - size / 2 },
              { x: cx + off - size / 2, y: cy - size / 2 },
            ];
        slide.sets.forEach((_, i) => {
          pSlide.addShape("ellipse", {
            x: spots[i].x, y: spots[i].y, w: size, h: size,
            fill: { color: p.series[i % 3], transparency: 45 },
            line: { color: p.canvas, width: 1.5 },
          });
        });
        pSlide.addText(
          slide.sets.map((s) => s.label).join("   ·   "),
          { x: d.rect.x + PAD, y: d.rect.y + d.rect.h - PAD - 0.26, w: d.rect.w - PAD * 2, h: 0.26, fontSize: 10, color: d.dim, align: "center" }
        );
      }
      const st = ctxOf("statement");
      if (st) {
        pSlide.addText(slide.statement, {
          x: st.rect.x + PAD, y: st.rect.y + PAD, w: st.rect.w - PAD * 2, h: st.rect.h - PAD * 2,
          fontSize: TYPE.statement, bold: true, color: st.ink, valign: "middle",
        });
      }
      const pr = ctxOf("proof");
      if (pr && slide.proof) {
        const s = stack(pr);
        s.push(0.1);
        s.add(slide.proof.label, { size: TYPE.label, color: pr.dim, caps: true, height: 0.2 });
        s.add(slide.proof.value, { size: TYPE.stat, bold: true, height: 0.5 });
      }
      return;
    }

    case "process": {
      const h = ctxOf("header");
      if (h) {
        pSlide.addText(slide.label.toUpperCase(), {
          x: h.rect.x + PAD, y: h.rect.y, w: h.rect.w * 0.6, h: h.rect.h,
          fontSize: TYPE.label, color: h.dim, charSpacing: 1.2, valign: "middle",
        });
        if (slide.meta) {
          pSlide.addText(slide.meta.toUpperCase(), {
            x: h.rect.x + h.rect.w * 0.4 - PAD, y: h.rect.y, w: h.rect.w * 0.6, h: h.rect.h,
            fontSize: TYPE.label, color: h.dim, charSpacing: 1.2, valign: "middle", align: "right",
          });
        }
      }
      const f = ctxOf("flow");
      if (f) {
        const n = slide.steps.length;
        const slot = (f.rect.w - PAD * 2) / n;
        const d = Math.min(0.62, slot * 0.42);
        const cy = f.rect.y + f.rect.h * 0.34;
        slide.steps.forEach((step, i) => {
          const cx = f.rect.x + PAD + slot * i + slot / 2;
          const last = i === n - 1;
          if (i > 0) {
            pSlide.addShape("line", {
              x: cx - slot + d / 2, y: cy, w: slot - d, h: 0,
              line: { color: p.border, width: 1.5 },
            });
          }
          pSlide.addShape("ellipse", {
            x: cx - d / 2, y: cy - d / 2, w: d, h: d,
            fill: { color: last ? p.tones[0] : f.p.s1 },
            line: last ? { type: "none" } : { color: p.tones[0], width: 1.5 },
          });
          pSlide.addText(String(i + 1).padStart(2, "0"), {
            x: cx - d / 2, y: cy - d / 2, w: d, h: d,
            fontSize: 11, bold: true, align: "center", valign: "middle",
            color: last ? p.onTone : p.tones[0],
          });
          pSlide.addText(step.label, {
            x: cx - slot / 2, y: cy + d / 2 + 0.08, w: slot, h: 0.26,
            fontSize: 12, bold: true, align: "center", color: f.ink,
          });
          pSlide.addText(step.detail, {
            x: cx - slot / 2, y: cy + d / 2 + 0.32, w: slot, h: 0.24,
            fontSize: 9.5, align: "center", color: f.dim,
          });
        });
      }
      (slide.footnotes ?? []).forEach((note, i) => {
        const c = ctxOf(`note${i}`);
        if (!c) return;
        pSlide.addText(note, {
          x: c.rect.x + PAD, y: c.rect.y, w: c.rect.w - PAD * 2, h: c.rect.h,
          fontSize: 11, color: c.ink, valign: "middle",
        });
      });
      return;
    }

    case "timeline": {
      if (slide.variant === "swimlane") {
        const h = ctxOf("header");
        if (h) {
          pSlide.addText(slide.label.toUpperCase(), {
            x: h.rect.x + PAD, y: h.rect.y, w: h.rect.w - PAD * 2, h: h.rect.h,
            fontSize: TYPE.label, color: h.dim, charSpacing: 1.2, valign: "middle",
          });
        }
        const l = ctxOf("lanes");
        if (l) {
          const lanes =
            slide.lanes?.length
              ? slide.lanes
              : slide.milestones.map((m, i) => ({
                  label: m.label,
                  start: (i / slide.milestones.length) * 100,
                  end: ((i + 1.6) / slide.milestones.length) * 100,
                }));
          drawChart(pSlide, { kind: "gantt", axisLabels: slide.milestones.map((m) => m.when), lanes }, l.rect, p, false);
        }
        return;
      }

      if (slide.variant === "rail") {
        const a = ctxOf("anchor");
        if (a) {
          const s = stack(a);
          s.add(slide.label, { size: TYPE.label, color: a.dim, caps: true, height: 0.22 });
          s.push(0.08);
          s.add(
            `${slide.milestones[0]?.when} → ${slide.milestones[slide.milestones.length - 1]?.when}`,
            { size: TYPE.statement, bold: true, height: 1.0 }
          );
        }
        slide.milestones.forEach((m, i) => {
          const c = ctxOf(`milestone${i}`);
          if (!c) return;
          pSlide.addText(m.when.toUpperCase(), {
            x: c.rect.x + PAD, y: c.rect.y, w: 0.9, h: c.rect.h,
            fontSize: TYPE.label, color: c.dim, charSpacing: 1.2, valign: "middle",
          });
          pSlide.addText(m.label, {
            x: c.rect.x + PAD + 0.95, y: c.rect.y, w: c.rect.w - 2.6, h: c.rect.h,
            fontSize: 15, bold: true, color: c.ink, valign: "middle",
          });
          pSlide.addText(m.detail, {
            x: c.rect.x + c.rect.w - 1.5 - PAD, y: c.rect.y, w: 1.5, h: c.rect.h,
            fontSize: 11, color: c.dim, valign: "middle", align: "right",
          });
        });
        return;
      }

      // series: milestones pinned on the metric's own curve
      const plot = ctxOf("plot");
      if (plot) {
        pSlide.addText(
          `${slide.label}${slide.metric ? ` · ${slide.metric.name}` : ""}`.toUpperCase(),
          { x: plot.rect.x + PAD, y: plot.rect.y + PAD, w: plot.rect.w - PAD * 2, h: 0.22, fontSize: TYPE.label, color: plot.dim, charSpacing: 1.2 }
        );
        const values = slide.metric?.values ?? slide.milestones.map((_, i) => i + 1);
        drawChart(
          pSlide,
          { kind: "area", xLabels: values.map((_, i) => String(i + 1)), values },
          plot.rect,
          p,
          isTone(plot.tile.surface)
        );
      }
      slide.milestones.slice(0, 3).forEach((m, i) => {
        const c = ctxOf(`milestone${i}`);
        if (!c) return;
        pSlide.addText(`${m.when} · ${m.label}`.toUpperCase(), {
          x: c.rect.x + PAD, y: c.rect.y + PAD, w: c.rect.w - PAD * 2, h: 0.24,
          fontSize: TYPE.label, color: c.dim, charSpacing: 1.2,
        });
        pSlide.addText(m.detail, {
          x: c.rect.x + PAD, y: c.rect.y + PAD + 0.26, w: c.rect.w - PAD * 2, h: c.rect.h - PAD * 2 - 0.26,
          fontSize: 11, color: c.ink,
        });
      });
      return;
    }

    case "comparison": {
      const ours = ctxOf("ours");
      if (ours) {
        const s = stack(ours);
        s.add(slide.ours.label, { size: TYPE.label, color: ours.dim, caps: true, height: 0.22 });
        s.add(slide.ours.heading, { size: TYPE.statement, bold: true, height: 0.85 });
        s.push(0.06);
        slide.ours.points.forEach((point) =>
          s.add(`•  ${point}`, { size: TYPE.listItem, height: 0.3 })
        );
      }
      const theirs = ctxOf("theirs");
      if (theirs) {
        const s = stack(theirs);
        s.add(slide.theirs.label, { size: TYPE.label, color: theirs.dim, caps: true, height: 0.22 });
        s.add(slide.theirs.heading, { size: TYPE.heading, bold: true, height: 0.4 });
        s.push(0.04);
        slide.theirs.points.forEach((point) =>
          s.add(`•  ${point}`, { size: 12, color: theirs.dim, height: 0.28 })
        );
      }
      const proof = ctxOf("proof");
      if (proof) {
        const s = stack(proof);
        s.push(0.12);
        s.add(slide.proof.label, { size: TYPE.label, color: proof.dim, caps: true, height: 0.2 });
        s.add(slide.proof.value, { size: TYPE.stat, bold: true, height: 0.5 });
        s.add(slide.proof.note, { size: 11, color: proof.dim, height: 0.26 });
      }
      return;
    }

    case "closing": {
      const a = ctxOf("anchor");
      if (a) {
        const s = stack(a);
        s.toBottom(1.5);
        s.add(slide.title, { size: TYPE.title, bold: true, height: 0.9 });
        s.add(slide.subtitle, { size: TYPE.subtitle, color: a.dim, height: 0.44 });
      }
      (slide.stats ?? []).forEach((stat, i) => {
        const c = ctxOf(`stat${i}`);
        if (!c) return;
        const s = stack(c);
        s.push(0.1);
        s.add(stat.label, { size: TYPE.label, color: c.dim, caps: true, height: 0.2 });
        s.add(stat.value, { size: TYPE.stat, bold: true, height: 0.5 });
      });
      const cta = ctxOf("cta");
      if (cta) {
        pSlide.addText(slide.cta, {
          x: cta.rect.x + PAD, y: cta.rect.y, w: cta.rect.w - PAD * 2, h: cta.rect.h,
          fontSize: 15, bold: true, color: cta.ink, valign: "middle",
        });
      }
      return;
    }
  }
}

export async function exportDeckAsPptx(deck: Deck): Promise<void> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pptx: any = new PptxGenJS();
  pptx.defineLayout({ name: "SG_16x9", width: SLIDE_W, height: SLIDE_H });
  pptx.layout = "SG_16x9";
  pptx.title = deck.title;

  const p = palette(deck.theme);

  deck.slides.forEach((slide) => {
    const pSlide = pptx.addSlide();
    pSlide.background = { color: p.canvas };
    fill(pSlide, slide, p);
  });

  const name = deck.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 60) || "deck";
  await pptx.writeFile({ fileName: `${name}.pptx` });
}
