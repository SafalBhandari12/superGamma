import type { BentoSlide } from "./bento.js";

/**
 * THE single source of layout truth.
 *
 * Both the React preview (→ CSS `grid-column` / `grid-row`) and the pptx
 * exporter (→ inches via `tileRect`) call `tilesFor()`. Neither computes
 * placement itself, so the on-screen deck and the exported file cannot
 * drift apart — the same failure mode that made template-stamping hard.
 */

export const GRID_COLS = 6;
export const GRID_ROWS = 4;

/** Slide geometry in inches (16:9), matching the existing pptx export. */
export const SLIDE_W = 10;
export const SLIDE_H = 5.63;
export const MARGIN = 0.42;
export const GAP = 0.16;
export const RADIUS = 0.11;

const COL_W = (SLIDE_W - MARGIN * 2 - GAP * (GRID_COLS - 1)) / GRID_COLS;
const ROW_H = (SLIDE_H - MARGIN * 2 - GAP * (GRID_ROWS - 1)) / GRID_ROWS;

/**
 * Surface treatment for a tile. `mesh` is the OKLCH gradient reserved for the
 * anchor; `tone1..5` are the theme's decorative fills; `s1..s3` are the neutral
 * elevation tiers. Never all one value — uniform tiles are a card layout, not
 * a bento grid.
 */
export type TileSurface =
  | "mesh"
  | "s1"
  | "s2"
  | "s3"
  | "tone1"
  | "tone2"
  | "tone3"
  | "tone4"
  | "tone5";

export interface BentoTile {
  /** stable key the renderer maps content onto */
  id: string;
  /** 1-indexed grid position */
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  surface: TileSurface;
  /** exactly one tile per slide carries the anchor role */
  anchor?: boolean;
}

export interface TileRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Grid units → inches, for the pptx exporter. */
export function tileRect(tile: BentoTile): TileRect {
  return {
    x: MARGIN + (tile.col - 1) * (COL_W + GAP),
    y: MARGIN + (tile.row - 1) * (ROW_H + GAP),
    w: tile.colSpan * COL_W + (tile.colSpan - 1) * GAP,
    h: tile.rowSpan * ROW_H + (tile.rowSpan - 1) * GAP,
  };
}

const t = (
  id: string,
  col: number,
  row: number,
  colSpan: number,
  rowSpan: number,
  surface: TileSurface,
  anchor = false
): BentoTile => ({ id, col, row, colSpan, rowSpan, surface, anchor });

/**
 * Layouts are content-count aware: a slide with three supporting stats gets a
 * different arrangement than one with five, because tile size must reflect
 * what the tile holds. Every arrangement keeps one anchor at roughly twice the
 * area of the next-largest tile.
 */
export function tilesFor(slide: BentoSlide): BentoTile[] {
  switch (slide.archetype) {
    case "hero":
      return [
        t("anchor", 1, 1, 4, 3, "mesh", true),
        t("stat0", 5, 1, 2, 2, "tone1"),
        t("stat1", 5, 3, 2, 2, "tone4"),
        t("footer", 1, 4, 4, 1, "s2"),
      ];

    case "statGrid": {
      const n = slide.stats.length;
      const lead = t("lead", 1, 1, 4, 2, "mesh", true);
      if (n <= 3) {
        return [
          lead,
          t("stat0", 5, 1, 2, 2, "tone2"),
          t("stat1", 1, 3, 3, 2, "tone4"),
          t("stat2", 4, 3, 3, 2, "s2"),
        ];
      }
      if (n === 4) {
        return [
          lead,
          t("stat0", 5, 1, 2, 1, "tone2"),
          t("stat1", 5, 2, 2, 1, "s3"),
          t("stat2", 1, 3, 3, 2, "tone4"),
          t("stat3", 4, 3, 3, 2, "s2"),
        ];
      }
      return [
        lead,
        t("stat0", 5, 1, 2, 1, "tone2"),
        t("stat1", 5, 2, 2, 1, "s3"),
        t("stat2", 1, 3, 2, 2, "tone4"),
        t("stat3", 3, 3, 2, 2, "s2"),
        t("stat4", 5, 3, 2, 2, "tone3"),
      ];
    }

    case "quadrant":
      // Equal-rank by intent — a matrix's cells are peers. Variety comes from
      // four different tone fills, not from size.
      return [
        t("cell0", 1, 1, 3, 2, "tone3"),
        t("cell1", 4, 1, 3, 2, "tone2"),
        t("cell2", 1, 3, 3, 2, "tone4"),
        t("cell3", 4, 3, 3, 2, "tone1"),
      ];

    case "featureGrid":
      return [
        t("anchor", 1, 1, 4, 2, "mesh", true),
        t("feature0", 5, 1, 2, 2, "tone4"),
        t("feature1", 1, 3, 2, 2, "s2"),
        t("feature2", 3, 3, 2, 2, "tone3"),
        t("feature3", 5, 3, 2, 2, "s3"),
      ];

    case "chart": {
      const sides = slide.sideStats?.length ?? 0;
      if (sides === 0) {
        return [
          t("chart", 1, 1, 6, 3, "s2", true),
          t("takeaway", 1, 4, 6, 1, "s3"),
        ];
      }
      if (sides === 1) {
        return [
          t("chart", 1, 1, 4, 3, "s2", true),
          t("side0", 5, 1, 2, 3, "tone4"),
          t("takeaway", 1, 4, 6, 1, "s3"),
        ];
      }
      return [
        t("chart", 1, 1, 4, 3, "s2", true),
        t("side0", 5, 1, 2, 2, "tone4"),
        t("side1", 5, 3, 2, 2, "s3"),
        t("takeaway", 1, 4, 4, 1, "s2"),
      ];
    }

    case "diagram":
      return [
        t("diagram", 1, 1, 3, 4, "s2", true),
        t("statement", 4, 1, 3, 2, "mesh"),
        t("proof", 4, 3, 3, 2, "tone1"),
      ];

    case "process": {
      const notes = slide.footnotes?.length ?? 0;
      const tiles = [
        t("header", 1, 1, 6, 1, "s2"),
        t("flow", 1, 2, 6, notes > 0 ? 2 : 3, "s3", true),
      ];
      if (notes === 0) return tiles;
      const width = notes === 1 ? 6 : notes === 2 ? 3 : 2;
      const surfaces: TileSurface[] = ["s2", "s2", "tone1"];
      for (let i = 0; i < notes; i++) {
        tiles.push(t(`note${i}`, 1 + i * width, 4, width, 1, surfaces[i] ?? "s2"));
      }
      return tiles;
    }

    case "timeline": {
      if (slide.variant === "swimlane") {
        return [
          t("header", 1, 1, 6, 1, "s2"),
          t("lanes", 1, 2, 6, 3, "s1", true),
        ];
      }
      if (slide.variant === "rail") {
        const rows = Math.min(slide.milestones.length, 4);
        const tiles = [t("anchor", 1, 1, 2, 4, "mesh", true)];
        const surfaces: TileSurface[] = ["s2", "s3", "s2", "tone1"];
        for (let i = 0; i < rows; i++) {
          tiles.push(t(`milestone${i}`, 3, 1 + i, 4, 1, surfaces[i] ?? "s2"));
        }
        return tiles;
      }
      // "series": milestones pinned to a real metric curve
      const count = Math.min(slide.milestones.length, 3);
      const width = count === 3 ? 2 : 3;
      const tiles = [t("plot", 1, 1, 6, 3, "mesh", true)];
      const surfaces: TileSurface[] = ["s2", "s3", "tone1"];
      for (let i = 0; i < count; i++) {
        tiles.push(t(`milestone${i}`, 1 + i * width, 4, width, 1, surfaces[i] ?? "s2"));
      }
      return tiles;
    }

    case "comparison":
      return [
        t("ours", 1, 1, 3, 4, "mesh", true),
        t("theirs", 4, 1, 3, 2, "s2"),
        t("proof", 4, 3, 3, 2, "tone1"),
      ];

    case "closing": {
      const stats = slide.stats?.length ?? 0;
      if (stats === 0) {
        return [
          t("anchor", 1, 1, 6, 3, "mesh", true),
          t("cta", 1, 4, 6, 1, "tone1"),
        ];
      }
      const tiles = [t("anchor", 1, 1, 4, 3, "mesh", true)];
      tiles.push(t("stat0", 5, 1, 2, stats === 1 ? 3 : 2, "tone1"));
      if (stats > 1) tiles.push(t("stat1", 5, 3, 2, 2, "tone4"));
      tiles.push(t("cta", 1, 4, 4, 1, "s2"));
      return tiles;
    }
  }
}

/** CSS grid shorthand for the web renderer. */
export function tileGridArea(tile: BentoTile): { gridColumn: string; gridRow: string } {
  return {
    gridColumn: `${tile.col} / ${tile.col + tile.colSpan}`,
    gridRow: `${tile.row} / ${tile.row + tile.rowSpan}`,
  };
}
