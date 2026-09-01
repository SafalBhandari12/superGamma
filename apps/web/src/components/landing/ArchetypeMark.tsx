import {
  GRID_COLS,
  GRID_ROWS,
  tilesFor,
  type Slide,
  type TileSurface,
} from "@supergamma/schema";

/**
 * A wireframe of an archetype's real grid, drawn straight from `tilesFor()`.
 *
 * The whole point is that it can't lie: if a layout changes in the schema
 * package, these diagrams change with it. The anchor tile — which the renderer
 * fills with a mesh gradient — is drawn here as solid ink, because the site's
 * design language is flat fills only.
 */
const SURFACE_FILL: Record<TileSurface, string> = {
  mesh: "#1F1B16",
  s1: "#FFFFFF",
  s2: "#FAF6EE",
  s3: "#F3EDE1",
  tone1: "#C2410C",
  tone2: "#CA8A04",
  tone3: "#4D7C0F",
  tone4: "#0F766E",
  tone5: "#9D174D",
};

const VB_W = 120;
const VB_H = 80;
const PAD = 3;
const GAP = 2;
const COL_W = (VB_W - PAD * 2 - GAP * (GRID_COLS - 1)) / GRID_COLS;
const ROW_H = (VB_H - PAD * 2 - GAP * (GRID_ROWS - 1)) / GRID_ROWS;

export function ArchetypeMark({ slide }: { slide: Slide }) {
  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="block w-full"
      role="img"
      aria-label={`${slide.archetype} layout`}
    >
      <rect width={VB_W} height={VB_H} rx="4" fill="#EDE8DE" />
      {tilesFor(slide).map((tile) => (
        <rect
          key={tile.id}
          x={PAD + (tile.col - 1) * (COL_W + GAP)}
          y={PAD + (tile.row - 1) * (ROW_H + GAP)}
          width={tile.colSpan * COL_W + (tile.colSpan - 1) * GAP}
          height={tile.rowSpan * ROW_H + (tile.rowSpan - 1) * GAP}
          rx="2.5"
          /* The anchor is drawn in ink whatever its surface, because the
             emphasis is what this diagram is about — and two of the layouts
             anchor on a neutral tier that would otherwise vanish here. */
          fill={tile.anchor ? SURFACE_FILL.mesh : SURFACE_FILL[tile.surface]}
          stroke="rgba(31,27,22,0.11)"
          strokeWidth="0.6"
        />
      ))}
    </svg>
  );
}
